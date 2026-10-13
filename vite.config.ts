import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const headers = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['mrchazaaa-asus-laptop'],
    headers,
    ...(process.env.PPOSE_HTTPS && { https: { key: readFileSync('.cert/server.key'), cert: readFileSync('.cert/server.crt') } }),
  },
  preview: { headers },
})
