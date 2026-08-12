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

mkdirSync(visitorDataDir, { recursive: true })

function loadTotalVisits() {
  try {
    const stored = JSON.parse(readFileSync(visitorDataFile, 'utf8'))
    return Number.isSafeInteger(stored.totalVisits) && stored.totalVisits >= 0 ? stored.totalVisits : 0
  } catch {
    return 0
  }
}

let totalVisits = loadTotalVisits()

function saveTotalVisits() {
  const temporaryFile = `${visitorDataFile}.tmp`
  writeFileSync(temporaryFile, JSON.stringify({ totalVisits }), 'utf8')
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
      const { visitorId } = JSON.parse(body || '{}')
      if (typeof visitorId !== 'string' || !/^[a-zA-Z0-9_-]{8,64}$/.test(visitorId)) {
        sendJson(response, 400, { error: 'Invalid visitor ID' })
        return
      }

      const now = Date.now()
      pruneVisitors(now)
      const isNewVisit = !activeVisitors.has(visitorId)
      activeVisitors.set(visitorId, now)

      if (isNewVisit) {
        totalVisits += 1
        saveTotalVisits()
      }

      sendJson(response, 200, { online: activeVisitors.size, totalVisits })
    } catch {
      sendJson(response, 400, { error: 'Invalid request' })
    }
  })
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
  const pathname = new URL(request.url || '/', 'http://localhost').pathname

  if (pathname === '/api/visitor-heartbeat') {
    if (request.method !== 'POST') {
      response.writeHead(405, { Allow: 'POST' })
      response.end('Method Not Allowed')
      return
    }
    handleVisitorHeartbeat(request, response)
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
  const cacheControl = extension === '.html' ? 'no-cache' : 'public, max-age=604800, immutable'
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
