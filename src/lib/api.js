// API base 設定：跟 diula-web 一樣依 hostname 判斷，本機/線上同一份程式碼都能跑。
//   dev（localhost）→ 回傳相對路徑，走 Vite dev proxy。
//   prod（部署後）  → 回傳各後端的絕對網址（Render 服務）。
const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname)

const FLASK = isLocal ? '' : 'https://diula.onrender.com'
const SPRING = isLocal ? '' : 'https://diula-api.onrender.com'
const AI = isLocal ? '/ext-ai' : 'https://diula-backend-api.onrender.com/api'

// 智慧比對 / 協尋發文 / 訂閱推播（Flask :5001）
export const flask = (path) => `${FLASK}${path}`
// 證件登錄 / Threads 貼文 / 圖片（Spring Boot :8080）
export const spring = (path) => `${SPRING}${path}`
// AI 圖片辨識（Render）
export const aiApi = (path) => `${AI}${path}`

// Threads 貼文：優先讀每日靜態快照（diula-web GitHub Pages，永遠醒著、CDN、秒開），
// 讀不到才退回會睡的 Spring Boot /api/posts（Render 冷啟動要 ~50 秒）。
// 資料一天才更新一次（scraper 每天跑），快照由每日同步的 export_threads_snapshot.py 產生並推上 Pages。
export const THREADS_SNAPSHOT = 'https://saamiin.github.io/diula-web/threads_posts.json'

export async function fetchThreadsPosts() {
  try {
    const r = await fetch(THREADS_SNAPSHOT, { cache: 'no-cache' })
    if (r.ok) {
      const data = await r.json()
      if (Array.isArray(data)) return data
    }
  } catch {
    /* 快照暫時讀不到 → 退回後端 API */
  }
  const r = await fetch(spring('/api/posts'))
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}
