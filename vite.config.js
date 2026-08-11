import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages 會放在 saamiin.github.io/diula-app/ → prod build 要加 base；dev 維持根路徑。
  // ⚠️ 若你的 repo 不叫 diula-app，改這裡的 '/diula-app/' 成 '/<你的repo名>/'。
  base: mode === 'production' ? '/diula-app/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // 證件 / Threads 貼文：Spring Boot :8080
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
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
}))
