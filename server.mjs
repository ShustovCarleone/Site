import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
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
  const temporaryFile = `${visitorDataFile}.tmp`
  writeFileSync(temporaryFile, JSON.stringify({ totalViews }), 'utf8')
  renameSync(temporaryFile, visitorDataFile)
}

function pruneVisitors(now = Date.now()) {
  activeVisitors.forEach((lastSeen, visitorId) => {
    if (now - lastSeen > activeWindowMs) activeVisitors.delete(visitorId)
  })
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  response.end(JSON.stringify(payload))
}

function handleVisitorHeartbeat(request, response) {
  let body = ''

  request.on('data', (chunk) => {
    body += chunk
    if (body.length > 4096) request.destroy()
  })

  request.on('end', () => {
    try {
      const { visitorId, pageView } = JSON.parse(body || '{}')
      if (typeof visitorId !== 'string' || !/^[a-zA-Z0-9_-]{8,64}$/.test(visitorId)) {
        sendJson(response, 400, { error: 'Invalid visitor ID' })
        return
      }

      const now = Date.now()
      pruneVisitors(now)
      activeVisitors.set(visitorId, now)

      if (pageView === true) {
        totalViews += 1
        saveTotalVisits()
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
}

function getFilePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname)
  const routes = {
    '/': 'index.html',
    '/privacy': 'privacy.html',
    '/privacy/': 'privacy.html',
  }
  const relativePath = routes[pathname] || pathname.replace(/^\/+/, '')
  const candidate = resolve(root, normalize(relativePath))
  return candidate.startsWith(resolve(root)) ? candidate : null
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url || '/', 'http://localhost')
  const pathname = requestUrl.pathname

  if (pathname === '/api/visitor-heartbeat') {
    if (request.method !== 'POST') {
      response.writeHead(405, { Allow: 'POST' })
      response.end('Method Not Allowed')
      return
    }
    handleVisitorHeartbeat(request, response)
    return
  }

  if (pathname === '/api/steam-news') {
    if (request.method !== 'GET') {
      response.writeHead(405, { Allow: 'GET' })
      response.end('Method Not Allowed')
      return
    }
    void handleSteamNews(requestUrl, response)
    return
  }

  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    response.writeHead(405, { Allow: 'GET, HEAD' })
    response.end('Method Not Allowed')
    return
  }

  let filePath = getFilePath(request.url || '/')
  if (filePath && existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html')

  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('404 — Page not found')
    return
  }

  const extension = extname(filePath).toLowerCase()
  const cacheControl = ['.html', '.js', '.css'].includes(extension)
    ? 'no-cache'
    : 'public, max-age=604800, immutable'
  response.writeHead(200, {
    'Content-Type': mimeTypes[extension] || 'application/octet-stream',
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
  })

  if (request.method === 'HEAD') response.end()
  else createReadStream(filePath).pipe(response)
})

server.listen(port, host, () => {
  console.log(`ShuGhost website running on http://${host}:${port}`)
})
