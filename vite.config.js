import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // /api/id-cards 那支後端故意只允許同源。開發時用 proxy 讓瀏覽器看到的是同源，
    // 由 Vite 在伺服器端轉發到 Spring Boot（localhost:8080），避開 CORS。
    proxy: {
      // 證件 / Threads 貼文：Spring Boot :8080
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 智慧比對 / 協尋發文 / 訂閱推播：Flask :5001
      '/match': { target: 'http://localhost:5001', changeOrigin: true },
      '/categories': { target: 'http://localhost:5001', changeOrigin: true },
      '/threads': { target: 'http://localhost:5001', changeOrigin: true },
      '/subscriptions': { target: 'http://localhost:5001', changeOrigin: true },
      // AI 圖片辨識：外部 Render 服務（避免 CORS，伺服器端轉發）
      '/ext-ai': {
        target: 'https://diula-backend-api.onrender.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ext-ai/, '/api'),
      },
    },
  },
})
