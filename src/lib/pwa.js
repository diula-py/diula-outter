// PWA Service Worker 註冊與更新（設定在 vite.config.js）。
// registerType 是 'prompt'：新版 SW 下載好後會先「等待」，舊版繼續服務目前的頁面，
// 等我們呼叫 updateSW() 才換上新版並重新整理。這樣可以避開正在填表單的頁面——
// 登記、跨平台搜尋填到一半被自動重整，照片和描述就全沒了。
import { registerSW } from 'virtual:pwa-register'

// 這些頁面有使用者輸入、或靠 location.state 帶資料，重整會弄丟 → 有新版也先不換。
// Threads 貼文頁只是瀏覽，可以照常更新。
function isBusyRoute(pathname) {
  if (pathname.startsWith('/search/threads')) return false
  return ['/register', '/search', '/login'].some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

// HashRouter：路由在 # 後面（react-router 換頁會同步改 hash），隨時都能從網址讀到目前頁面。
function currentRoute() {
  return window.location.hash.replace(/^#/, '').split('?')[0] || '/'
}

let updateSW = null
let updatePending = false

// 有等待中的新版、而且目前不在忙碌頁面 → 換上新版（會重新整理一次）。
// 由 SwUpdater 在每次換頁時呼叫；新版剛下載好時也會呼叫一次。
export function applyPendingUpdate() {
  if (!updatePending || !updateSW || isBusyRoute(currentRoute())) return
  updatePending = false
  // registerSW 只在「這頁載入時就已經有 SW」才會自己重整；第一次安裝後同一頁又遇到更新時不會，這裡補上。
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
  updateSW(true)
}

export function initPwa() {
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updatePending = true
      applyPendingUpdate()
    },
    // 展場裝置可能整天開著不重整 → 每小時、以及每次切回這個分頁時都主動檢查一次更新。
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
}
