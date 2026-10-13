import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['mrchazaaa-asus-laptop'],
    ...(process.env.PPOSE_HTTPS && { https: { key: readFileSync('.cert/server.key'), cert: readFileSync('.cert/server.crt') } }),
  },
})
