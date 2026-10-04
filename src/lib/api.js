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

// 離線備援：最後一次成功抓到的快照另存一份在 localStorage（約 40KB）。
// SW 的 threads-snapshot 快取是第一層；iOS 清掉 SW 快取、或 SW 還沒接手時，靠這份。
const THREADS_LOCAL_KEY = 'diula_threads_snapshot'

function saveLocalThreads(data) {
  try {
    localStorage.setItem(THREADS_LOCAL_KEY, JSON.stringify(data))
  } catch {
    /* storage 滿了或不能用就算了 */
  }
}

function loadLocalThreads() {
  try {
    const data = JSON.parse(localStorage.getItem(THREADS_LOCAL_KEY) || 'null')
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

async function fetchSnapshot() {
  const r = await fetch(THREADS_SNAPSHOT, { cache: 'no-cache' })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const data = await r.json()
  if (!Array.isArray(data)) throw new Error('快照格式錯誤')
  saveLocalThreads(data)
  return data
}

// 開網站時在背景先抓一次快照（main.jsx 呼叫），沒點進 Threads 頁離線也看得到。
export function prefetchThreadsSnapshot() {
  if (!navigator.onLine) return
  fetchSnapshot().catch(() => {})
}

export async function fetchThreadsPosts() {
  try {
    // 離線時這個 fetch 會由 SW 回傳快取的快照
    return await fetchSnapshot()
  } catch {
    /* 快照暫時讀不到 → 退回後端 API（離線就不打了） */
  }
  if (navigator.onLine) {
    try {
      const r = await fetch(spring('/api/posts'))
      if (r.ok) return await r.json()
    } catch {
      /* 後端也讀不到 → 用本機備份 */
    }
  }
  const local = loadLocalThreads()
  if (local) return local
  const err = new Error('讀不到 Threads 貼文')
  err.offline = !navigator.onLine
  throw err
}
