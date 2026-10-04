import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './fonts.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './lib/debugItems.js'
import { registerSW } from 'virtual:pwa-register'

// PWA Service Worker（設定在 vite.config.js）。autoUpdate：有新版就自動換上並重新整理頁面。
// 展場裝置可能整天開著不重整 → 每小時、以及每次切回這個分頁時都主動檢查一次更新。
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    const checkUpdate = () => {
      if (navigator.onLine) registration.update().catch(() => {})
    }
    setInterval(checkUpdate, 60 * 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkUpdate()
    })
  },
})

// GitHub Pages 沒有伺服器路由，重整/直連深層網址會 404 → 用 HashRouter（網址帶 #）。
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
