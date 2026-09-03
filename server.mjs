import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const resolvedRoot = resolve(root)
const resolvedRootPrefix = `${resolvedRoot}${sep}`
const port = Number(process.env.PORT) || 3000
const host = '0.0.0.0'

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
