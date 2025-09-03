import { createServer } from 'https'
import type { IncomingMessage, ServerResponse } from 'http'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { readFileSync } from 'fs'

const PORT = Number(process.env.PORT) || 4000
const HOST = process.env.HOST || 'localhost'

const options = {
  key: readFileSync(join(__dirname, 'key.pem')),
  cert: readFileSync(join(__dirname, 'cert.pem')),
}

const server = createServer(
  options,
  async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // Serve static files for .js requests
      if (req.url && req.url.endsWith('.js')) {
        const scriptPath = join(__dirname, req.url.replace(/^\//, ''))
        try {
          const scriptContent = await readFile(scriptPath, 'utf-8')
          res.writeHead(200, {
            'Content-Type': 'application/javascript',
            'Content-Length': Buffer.byteLength(scriptContent),
          })
          res.end(scriptContent)
          return
        } catch (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' })
          res.end('Script not found')
          return
        }
      }

      // Serve index.html for all other requests
      const htmlPath = join(__dirname, 'index.html')
      const htmlContent = await readFile(htmlPath, 'utf-8')

      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Length': Buffer.byteLength(htmlContent),
      })

      res.end(htmlContent)
    } catch (error) {
      console.error('Error serving file:', error)

      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Internal Server Error')
    }
  }
)

server.listen(PORT, HOST, () => {
  console.log(`Server running at https://${HOST}:${PORT}/`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
