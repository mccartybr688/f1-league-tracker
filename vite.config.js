import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the same build works at a domain root (Netlify)
// or under a sub-path like /f1-league-tracker/ (GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
})
