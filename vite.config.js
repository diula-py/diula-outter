import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages 放在 diula-py.github.io/diula-outter/ → prod build 要加 base；dev 維持根路徑。
  // ⚠️ base 必須等於 GitHub repo 名。repo 改名時這裡要一起改。
  base: mode === 'production' ? '/diula-outter/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    // PWA：Service Worker 快取網頁外殼，離線也能打開網站（企劃書「查看快取之協尋資訊」）。
    // SW 檔案、scope、precache 路徑都跟著上面的 base 走（prod = /diula-outter/）。
    // 註冊寫在 src/main.jsx；緊急停用 SW 的步驟見 docs/pwa.md。
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // 由 main.jsx 自己呼叫 registerSW，才能加定時檢查更新
      manifest: false, // 沿用 public/manifest.webmanifest，不另外產生
      // ⚠️ 緊急停用：把下一行註解拿掉、push 到 main 部署 → 所有裝置的 SW 會自我移除並清掉快取。
      // selfDestroying: true,
      workbox: {
        // 源泉圓體三個 woff2 各約 6MB，不放 precache（改在下面 runtimeCaching 第一次載入後才存）。
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        globIgnores: ['**/*.woff2'],
        // HashRouter：所有頁面都是 index.html，離線導覽一律回 index.html。
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/\/__\//], // Firebase Auth 的 /__/auth/* 不走 fallback
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // 只快取下面這幾種；其餘請求（Firestore、Firebase Auth、LIFF、Google OAuth、
        // Render 上的 Flask / Spring Boot / AI API）SW 一律不攔截，直接走網路。
        runtimeCaching: [
          {
            // 源泉圓體（同網域、檔名帶 hash，內容不會變）
            urlPattern: ({ sameOrigin, url }) => sameOrigin && url.pathname.endsWith('.woff2'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'diula-fonts',
              expiration: { maxEntries: 6 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Comfortaa 的 CSS
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            // Comfortaa 的字型檔
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Threads 每日快照（src/lib/api.js 的 THREADS_SNAPSHOT）：有網路抓最新，離線用最後一次的。
            // 只快取這份 GET；退回的 Spring Boot /api/posts 和縮圖 /api/image 都不快取。
            urlPattern: ({ url }) => url.href.split('?')[0] === 'https://saamiin.github.io/diula-web/threads_posts.json',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'threads-snapshot',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 1 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    proxy: {
      // 證件 / Threads 貼文：Spring Boot。
      // ⚠️ 暫時改指向線上 Render（本機沒在跑 8080 時測試用）。
      // 謝旻本機有跑 Spring Boot 的話，改回 'http://localhost:8080' 再測。
      '/api': { target: 'https://diula-api.onrender.com', changeOrigin: true },
      // 智慧比對 / 協尋發文 / 訂閱推播：Flask。同上，暫時改指向線上 Render。
      '/match': { target: 'https://diula.onrender.com', changeOrigin: true },
      '/categories': { target: 'https://diula.onrender.com', changeOrigin: true },
      '/threads': { target: 'https://diula.onrender.com', changeOrigin: true },
      '/subscriptions': { target: 'https://diula.onrender.com', changeOrigin: true },
      // AI 圖片辨識：外部 Render 服務（避免 CORS，伺服器端轉發）
      '/ext-ai': {
        target: 'https://diula-backend-api.onrender.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ext-ai/, '/api'),
      },
    },
  },
}))
