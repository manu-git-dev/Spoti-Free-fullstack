import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Alias "@" -> ./src. En ESM `__dirname` n'existe pas : on derive le chemin depuis
      // import.meta.url, la facon idiomatique cote module ES (et ca retire l'import `path`).
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
