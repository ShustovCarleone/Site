import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const port = Number(process.env.PORT) || 3000
const host = '0.0.0.0'

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
