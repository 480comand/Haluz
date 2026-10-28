import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
  // es2022 kvôli top-level await v src/data/foods.js (Safari 15+).
  build: { target: 'es2022' },
})
