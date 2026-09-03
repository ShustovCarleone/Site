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
const recentPageViews = new Map()
const visitorRateLimits = new Map()
const activeVisitorWindowMs = 45_000
const pageViewWindowMs = 30 * 60 * 1000
const rateLimitWindowMs = 60_000
const maximumTrackedClients = 10_000
const maximumJsonBodyBytes = 4096
let saveTimer = null
let viewsDirty = false

try {
  mkdirSync(visitorDataDir, { recursive: true })
} catch (error) {
  console.error('Unable to prepare visitor statistics storage:', error)
}

function loadTotalViews() {
  try {
    const stored = JSON.parse(readFileSync(visitorDataFile, 'utf8'))
    const value = stored.totalViews ?? stored.totalVisits
    return Number.isSafeInteger(value) && value >= 0 ? value : 0
  } catch {
    return 0
  }
}

let totalViews = loadTotalViews()

function saveTotalViews() {
  try {
    const temporaryFile = `${visitorDataFile}.tmp`
    writeFileSync(temporaryFile, JSON.stringify({ totalViews }), 'utf8')
    renameSync(temporaryFile, visitorDataFile)
    viewsDirty = false
  } catch (error) {
    console.error('Unable to save visitor statistics:', error)
  }
}

function scheduleViewSave() {
  viewsDirty = true
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    if (viewsDirty) saveTotalViews()
  }, 5000)
  saveTimer.unref()
}

function pruneVisitorState(now = Date.now()) {
  activeVisitors.forEach((lastSeen, visitorId) => {
    if (now - lastSeen > activeVisitorWindowMs) activeVisitors.delete(visitorId)
  })
  recentPageViews.forEach((lastSeen, key) => {
    if (now - lastSeen > pageViewWindowMs) recentPageViews.delete(key)
  })
  visitorRateLimits.forEach((entry, key) => {
    if (entry.resetAt <= now) visitorRateLimits.delete(key)
  })

  while (activeVisitors.size > maximumTrackedClients) activeVisitors.delete(activeVisitors.keys().next().value)
  while (recentPageViews.size > maximumTrackedClients) recentPageViews.delete(recentPageViews.keys().next().value)
  while (visitorRateLimits.size > maximumTrackedClients) visitorRateLimits.delete(visitorRateLimits.keys().next().value)
}

function getClientIp(request) {
  const realIp = request.headers['x-real-ip']
  if (typeof realIp === 'string' && realIp.length <= 64) return realIp

  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim().slice(0, 64)
  return request.socket.remoteAddress || 'unknown'
}

function allowVisitorRequest(request) {
  const now = Date.now()
  const key = getClientIp(request)
  const current = visitorRateLimits.get(key)
  if (!current || current.resetAt <= now) {
    visitorRateLimits.set(key, { count: 1, resetAt: now + rateLimitWindowMs })
    return true
  }

  current.count += 1
  return current.count <= 30
}

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.xml', 'application/xml; charset=utf-8'],
])

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    ...securityHeaders,
    'Content-Type': 'text/plain; charset=utf-8',
  })
  response.end(message)
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    ...securityHeaders,
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
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
      pruneVisitorState(now)
      activeVisitors.set(visitorId, now)

      const pageViewKey = `${getClientIp(request)}:${visitorId}`
      const previousView = recentPageViews.get(pageViewKey) || 0
      if (pageView === true && now - previousView >= pageViewWindowMs) {
        recentPageViews.set(pageViewKey, now)
        totalViews += 1
        scheduleViewSave()
      }

      sendJson(response, 200, { online: activeVisitors.size, views: totalViews })
    } catch {
      sendJson(response, 400, { error: 'Invalid request' })
    }
  })
}

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl || '/', 'http://localhost')
  let pathname = decodeURIComponent(url.pathname)
  if (pathname === '/') pathname = '/index.html'
  if (pathname === '/privacy') pathname = '/privacy.html'

  const relativePath = normalize(pathname).replace(/^[/\\]+/, '')
  const filePath = resolve(resolvedRoot, relativePath)
  if (filePath !== resolvedRoot && !filePath.startsWith(resolvedRootPrefix)) return null
  return filePath
}

const server = createServer((request, response) => {
  let requestUrl
  try {
    requestUrl = new URL(request.url || '/', 'http://localhost')
  } catch {
    sendText(response, 400, 'Bad request')
    return
  }

  if (requestUrl.pathname === '/api/visitor-heartbeat') {
    if (request.method !== 'POST') {
      response.writeHead(405, {
        ...securityHeaders,
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
        Allow: 'POST',
      })
      response.end('Method not allowed')
      return
    }
    if (!allowVisitorRequest(request)) {
      sendJson(response, 429, { error: 'Too many requests' })
      return
    }
    handleVisitorHeartbeat(request, response)
    return
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(response, 405, 'Method not allowed')
    return
  }

  let filePath
  try {
    filePath = resolveRequestPath(request.url)
  } catch {
    sendText(response, 400, 'Bad request')
    return
  }

  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    sendText(response, 404, 'Not found')
    return
  }

  const contentType = contentTypes.get(extname(filePath).toLowerCase()) || 'application/octet-stream'
  response.writeHead(200, {
    ...securityHeaders,
    'Cache-Control': contentType.startsWith('text/html') ? 'no-cache' : 'public, max-age=3600',
    'Content-Type': contentType,
  })

  if (request.method === 'HEAD') {
    response.end()
    return
  }

  createReadStream(filePath).pipe(response)
})

server.listen(port, host, () => {
  console.log(`ShuGhost website running at http://${host}:${port}`)
})
