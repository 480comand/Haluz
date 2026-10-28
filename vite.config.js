import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
  // Databáza produktov je zámerne súčasťou balíka (~200 kB gzip).
  build: { chunkSizeWarningLimit: 1200 },
})
