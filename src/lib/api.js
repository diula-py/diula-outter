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
