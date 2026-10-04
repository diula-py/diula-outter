import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './fonts.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './lib/debugItems.js'
import { registerSW } from 'virtual:pwa-register'
import { prefetchThreadsSnapshot } from './lib/api'
import { initLiff } from './lib/liff'

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

// 背景先抓一次 Threads 快照存起來，離線時 Threads 頁才有東西看（見 lib/api.js）。
prefetchThreadsSnapshot()

// 在 LINE 裡開 LIFF 時，LINE 會把 access_token 等參數塞在網址 # 後面，等 liff.init() 讀完才清掉。
// HashRouter 也是讀 #，如果先 render，會把「#access_token=...」當成路由 → 沒有路由符合 → 白畫面；
// liff.init() 之後用 replaceState 清網址，HashRouter 收不到通知，要重整好幾次才會出現畫面。
// 所以先等 liff.init() 跑完再掛 Router。最多等 5 秒；離線時 AuthContext 不跑 LIFF，這裡也直接跳過。
const liffReady = navigator.onLine
  ? Promise.race([initLiff().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 5000))])
  : Promise.resolve()

// GitHub Pages 沒有伺服器路由，重整/直連深層網址會 404 → 用 HashRouter（網址帶 #）。
liffReady.then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </StrictMode>,
  )
})
