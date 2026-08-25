import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const resolvedRoot = resolve(root)
const resolvedRootPrefix = `${resolvedRoot}${sep}`
const port = Number(process.env.PORT) || 3000
const host = '0.0.0.0'
const visitorDataDir = process.env.VISITOR_DATA_DIR
  || process.env.RAILWAY_VOLUME_MOUNT_PATH
  || (process.platform !== 'win32' && existsSync('/data') ? '/data' : join(root, '.data'))
const visitorDataFile = join(visitorDataDir, 'visitor-stats.json')
const activeVisitors = new Map()
const activeWindowMs = 45_000
const supportedSteamApps = new Set(['4981140', '4925710'])
const steamNewsCache = new Map()
const steamNewsCacheMs = 15 * 60 * 1000
const steamMediaCache = new Map()
const steamMediaCacheMs = 15 * 60 * 1000
const rateLimits = new Map()
const recentPageViews = new Map()
const rateLimitWindowMs = 60_000
const pageViewWindowMs = 30 * 60 * 1000
const maximumTrackedClients = 10_000
const maximumJsonBodyBytes = 4096
let saveTimer = null
let visitsDirty = false

mkdirSync(visitorDataDir, { recursive: true })

function loadTotalVisits() {
  try {
    const stored = JSON.parse(readFileSync(visitorDataFile, 'utf8'))
    const value = stored.totalViews ?? stored.totalVisits
    return Number.isSafeInteger(value) && value >= 0 ? value : 0
  } catch {
    return 0
  }
}

let totalViews = loadTotalVisits()

function saveTotalVisits() {
  try {
    const temporaryFile = `${visitorDataFile}.tmp`
    writeFileSync(temporaryFile, JSON.stringify({ totalViews }), 'utf8')
    renameSync(temporaryFile, visitorDataFile)
    visitsDirty = false
  } catch (error) {
    console.error('Unable to save visitor statistics:', error)
  }
}

function scheduleVisitSave() {
  visitsDirty = true
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    if (visitsDirty) saveTotalVisits()
  }, 5000)
  saveTimer.unref()
}

function pruneVisitors(now = Date.now()) {
  activeVisitors.forEach((lastSeen, visitorId) => {
    if (now - lastSeen > activeWindowMs) activeVisitors.delete(visitorId)
  })
}

function pruneProtectionState(now = Date.now()) {
  rateLimits.forEach((entry, key) => {
    if (entry.resetAt <= now) rateLimits.delete(key)
  })
  recentPageViews.forEach((lastSeen, key) => {
    if (now - lastSeen > pageViewWindowMs) recentPageViews.delete(key)
  })

  while (rateLimits.size > maximumTrackedClients) rateLimits.delete(rateLimits.keys().next().value)
  while (recentPageViews.size > maximumTrackedClients) recentPageViews.delete(recentPageViews.keys().next().value)
}

function getClientIp(request) {
  const railwayIp = request.headers['x-real-ip']
  if (typeof railwayIp === 'string' && railwayIp.length <= 64) return railwayIp
  return request.socket.remoteAddress || 'unknown'
}

function allowRequest(request, bucket, maximumRequests) {
  const now = Date.now()
  const key = `${bucket}:${getClientIp(request)}`
  const current = rateLimits.get(key)

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + rateLimitWindowMs })
    return { allowed: true, retryAfter: 0 }
  }

  current.count += 1
  if (current.count <= maximumRequests) return { allowed: true, retryAfter: 0 }
  return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) }
}

function securityHeaders(contentType = '') {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cross-Origin-Opener-Policy': 'same-origin',
  }

  if (contentType.startsWith('text/html')) {
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https://shared.akamai.steamstatic.com https://static-cdn.jtvnw.net https://www.google.com https://*.google.com https://*.googleadservices.com https://*.doubleclick.net",
      "connect-src 'self' https://video.akamai.steamstatic.com https://www.google-analytics.com https://*.google-analytics.com https://*.googleadservices.com https://*.doubleclick.net",
      "media-src 'self' blob: https://video.akamai.steamstatic.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      'upgrade-insecure-requests',
    ].join('; ')
  }

  return headers
}

function sendText(response, statusCode, text, extraHeaders = {}) {
  const contentType = 'text/plain; charset=utf-8'
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    ...securityHeaders(contentType),
    ...extraHeaders,
  })
  response.end(text)
}

function sendJson(response, statusCode, payload) {
  const contentType = 'application/json; charset=utf-8'
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    ...securityHeaders(contentType),
  })
  response.end(JSON.stringify(payload))
}

function sendRateLimit(response, retryAfter) {
  const contentType = 'application/json; charset=utf-8'
  response.writeHead(429, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'Retry-After': String(retryAfter),
    ...securityHeaders(contentType),
  })
  response.end(JSON.stringify({ error: 'Too many requests. Please try again shortly.' }))
}

function handleVisitorHeartbeat(request, response) {
  let body = ''
  let bodyTooLarge = false

  request.on('data', (chunk) => {
    if (bodyTooLarge) return
    body += chunk
    if (Buffer.byteLength(body, 'utf8') > maximumJsonBodyBytes) {
      bodyTooLarge = true
      body = ''
    }
  })

  request.on('end', () => {
    if (bodyTooLarge) {
      sendJson(response, 413, { error: 'Request body is too large' })
      return
    }

    try {
      const { visitorId, pageView } = JSON.parse(body || '{}')
      if (typeof visitorId !== 'string' || !/^[a-zA-Z0-9_-]{8,64}$/.test(visitorId)) {
        sendJson(response, 400, { error: 'Invalid visitor ID' })
        return
      }

      const now = Date.now()
      pruneVisitors(now)
      activeVisitors.set(visitorId, now)

      const pageViewKey = `${getClientIp(request)}:${visitorId}`
      const previousPageView = recentPageViews.get(pageViewKey) || 0
      if (pageView === true && now - previousPageView >= pageViewWindowMs) {
        recentPageViews.set(pageViewKey, now)
        totalViews += 1
        scheduleVisitSave()
      }

      sendJson(response, 200, { online: activeVisitors.size, views: totalViews })
    } catch {
      sendJson(response, 400, { error: 'Invalid request' })
    }
  })
}

function summarizeSteamContent(content) {
  const text = String(content || '')
    .replace(/\[img\][\s\S]*?\[\/img\]/gi, ' ')
    .replace(/\[(?:\/)?[^\]]+\]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= 620) return text
  const shortened = text.slice(0, 620)
  const lastSpace = shortened.lastIndexOf(' ')
  return `${shortened.slice(0, Math.max(lastSpace, 560)).trim()}…`
}

function isAllowedSteamNewsUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase()
    return hostname === 'steamcommunity.com'
      || hostname.endsWith('.steamcommunity.com')
      || hostname === 'steampowered.com'
      || hostname.endsWith('.steampowered.com')
      || hostname === 'akamaihd.net'
      || hostname.endsWith('.akamaihd.net')
  } catch {
    return false
  }
}

async function fetchSteamNews(appId) {
  const cached = steamNewsCache.get(appId)
  if (cached && Date.now() - cached.timestamp < steamNewsCacheMs) return cached.items

  try {
    const newsById = new Map()
    let endDate = null

    for (let page = 0; page < 5; page += 1) {
      const endpoint = new URL('https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/')
      endpoint.searchParams.set('appid', appId)
      endpoint.searchParams.set('count', '20')
      endpoint.searchParams.set('maxlength', '1800')
      endpoint.searchParams.set('feeds', 'steam_community_announcements')
      endpoint.searchParams.set('format', 'json')
      if (endDate) endpoint.searchParams.set('enddate', String(endDate))

      const steamResponse = await fetch(endpoint, {
        headers: { Accept: 'application/json', 'User-Agent': 'ShuGhost-Website/1.0' },
        signal: AbortSignal.timeout(10_000),
      })
      if (!steamResponse.ok) throw new Error(`Steam API returned ${steamResponse.status}`)

      const payload = await steamResponse.json()
      const pageItems = payload?.appnews?.newsitems || []
      pageItems.forEach((item) => newsById.set(String(item.gid || ''), item))
      if (pageItems.length < 20) break

      const dates = pageItems.map((item) => Number(item.date)).filter(Number.isFinite)
      if (dates.length === 0) break
      endDate = Math.min(...dates) - 1
    }

    const items = [...newsById.values()]
      .filter((item) => item?.feedname === 'steam_community_announcements' && isAllowedSteamNewsUrl(item.url))
      .map((item) => ({
        id: String(item.gid || ''),
        title: String(item.title || 'Steam update'),
        summary: summarizeSteamContent(item.contents),
        url: item.url,
        date: Number(item.date) || 0,
      }))
      .sort((a, b) => b.date - a.date)

    steamNewsCache.set(appId, { timestamp: Date.now(), items })
    return items
  } catch (error) {
    if (cached) return cached.items
    throw error
  }
}

async function handleSteamNews(requestUrl, response) {
  const appId = requestUrl.searchParams.get('appid') || ''
  if (!supportedSteamApps.has(appId)) {
    sendJson(response, 400, { error: 'Unsupported Steam App ID' })
    return
  }

  try {
    const items = await fetchSteamNews(appId)
    sendJson(response, 200, { appId, items })
  } catch {
    sendJson(response, 502, { error: 'Steam news is temporarily unavailable' })
  }
}

function isAllowedSteamMediaUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase()
    return hostname === 'steamstatic.com'
      || hostname.endsWith('.steamstatic.com')
      || hostname === 'akamaihd.net'
      || hostname.endsWith('.akamaihd.net')
  } catch {
    return false
  }
}

async function fetchSteamMedia(appId) {
  const cached = steamMediaCache.get(appId)
  if (cached && Date.now() - cached.timestamp < steamMediaCacheMs) return cached.media

  try {
    const endpoint = new URL('https://store.steampowered.com/api/appdetails')
    endpoint.searchParams.set('appids', appId)
    endpoint.searchParams.set('l', 'english')
    const steamResponse = await fetch(endpoint, {
      headers: { Accept: 'application/json', 'User-Agent': 'ShuGhost-Website/1.0' },
      signal: AbortSignal.timeout(10_000),
    })
    if (!steamResponse.ok) throw new Error(`Steam Store API returned ${steamResponse.status}`)

    const payload = await steamResponse.json()
    const movies = payload?.[appId]?.data?.movies
    if (!Array.isArray(movies) || movies.length === 0) throw new Error('Steam did not return a trailer')
    const movie = movies.find((item) => item?.highlight) || movies[0]
    const hls = String(movie?.hls_h264 || '')
    const poster = String(movie?.thumbnail || '')
    if (!isAllowedSteamMediaUrl(hls) || !isAllowedSteamMediaUrl(poster)) {
      throw new Error('Steam returned an unexpected media host')
    }

    const media = { name: String(movie?.name || 'Official trailer'), hls, poster }
    steamMediaCache.set(appId, { timestamp: Date.now(), media })
    return media
  } catch (error) {
    if (cached) return cached.media
    throw error
  }
}

async function handleSteamMedia(requestUrl, response) {
  const appId = requestUrl.searchParams.get('appid') || ''
  if (!supportedSteamApps.has(appId)) {
    sendJson(response, 400, { error: 'Unsupported Steam App ID' })
    return
  }

  try {
    const media = await fetchSteamMedia(appId)
    sendJson(response, 200, { appId, media })
  } catch {
    sendJson(response, 502, { error: 'Steam media is temporarily unavailable' })
  }
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

function getFilePath(requestUrl) {
  let pathname
  try {
    pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname)
  } catch {
    return null
  }
  const routes = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/privacy': 'privacy.html',
    '/privacy/': 'privacy.html',
    '/privacy.html': 'privacy.html',
    '/robots.txt': 'robots.txt',
    '/sitemap.xml': 'sitemap.xml',
    '/google831fe18e8943573a.html': 'google831fe18e8943573a.html',
  }
  const relativePath = routes[pathname]
    || (pathname.startsWith('/assets/') ? pathname.replace(/^\/+/, '') : null)
  if (!relativePath || relativePath.split('/').some((part) => part.startsWith('.'))) return null
  const candidate = resolve(root, normalize(relativePath))
  return candidate === resolvedRoot || candidate.startsWith(resolvedRootPrefix) ? candidate : null
}

const server = createServer((request, response) => {
  if ((request.url || '').length > 2048) {
    sendText(response, 414, 'URI Too Long')
    return
  }

  let requestUrl
  try {
    requestUrl = new URL(request.url || '/', 'http://localhost')
  } catch {
    sendText(response, 400, 'Bad Request')
    return
  }
  const pathname = requestUrl.pathname

  if (pathname === '/health') {
    if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
      sendText(response, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' })
      return
    }
    const contentType = 'application/json; charset=utf-8'
    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      ...securityHeaders(contentType),
    })
    const payload = JSON.stringify({ status: 'ok', uptime: Math.floor(process.uptime()) })
    response.end(request.method === 'HEAD' ? undefined : payload)
    return
  }

  if (pathname === '/api/visitor-heartbeat') {
    if (request.method !== 'POST') {
      sendText(response, 405, 'Method Not Allowed', { Allow: 'POST' })
      return
    }
    const rateLimit = allowRequest(request, 'visitor', 30)
    if (!rateLimit.allowed) {
      sendRateLimit(response, rateLimit.retryAfter)
      return
    }
    handleVisitorHeartbeat(request, response)
    return
  }

  if (pathname === '/api/steam-news') {
    if (request.method !== 'GET') {
      sendText(response, 405, 'Method Not Allowed', { Allow: 'GET' })
      return
    }
    const rateLimit = allowRequest(request, 'steam-news', 60)
    if (!rateLimit.allowed) {
      sendRateLimit(response, rateLimit.retryAfter)
      return
    }
    void handleSteamNews(requestUrl, response)
    return
  }

  if (pathname === '/api/steam-media') {
    if (request.method !== 'GET') {
      sendText(response, 405, 'Method Not Allowed', { Allow: 'GET' })
      return
    }
    const rateLimit = allowRequest(request, 'steam-media', 60)
    if (!rateLimit.allowed) {
      sendRateLimit(response, rateLimit.retryAfter)
      return
    }
    void handleSteamMedia(requestUrl, response)
    return
  }

  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    sendText(response, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' })
    return
  }

  let filePath = getFilePath(request.url || '/')
  if (filePath && existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html')

  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    sendText(response, 404, '404 — Page not found')
    return
  }

  const extension = extname(filePath).toLowerCase()
  const cacheControl = ['.html', '.js', '.css'].includes(extension)
    ? 'no-cache'
    : 'public, max-age=604800, immutable'
  response.writeHead(200, {
    'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    'Cache-Control': cacheControl,
    ...securityHeaders(mimeTypes[extension] || 'application/octet-stream'),
  })

  if (request.method === 'HEAD') response.end()
  else {
    const stream = createReadStream(filePath)
    stream.on('error', (error) => {
      console.error('Unable to stream static file:', error)
      if (!response.headersSent) sendText(response, 500, 'Internal Server Error')
      else response.destroy(error)
    })
    stream.pipe(response)
  }
})

server.requestTimeout = 15_000
server.headersTimeout = 10_000
server.keepAliveTimeout = 5_000
server.maxHeadersCount = 100

server.on('clientError', (_error, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n')
})

const protectionCleanup = setInterval(pruneProtectionState, 60_000)
protectionCleanup.unref()

function shutdown(signal) {
  console.log(`${signal} received; shutting down cleanly`)
  if (saveTimer) clearTimeout(saveTimer)
  if (visitsDirty) saveTotalVisits()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.once('SIGTERM', () => shutdown('SIGTERM'))
process.once('SIGINT', () => shutdown('SIGINT'))
process.on('unhandledRejection', (error) => console.error('Unhandled promise rejection:', error))

server.listen(port, host, () => {
  console.log(`ShuGhost website running on http://${host}:${port}`)
})
