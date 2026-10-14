// 把各種錯誤翻成使用者看得懂的中文。不要讓「Failed to fetch」「HTTP 500」
// 或開發用提示（「請確認 Flask 有啟動」）直接出現在畫面上。

// 後端回非 2xx 時丟這個，帶著狀態碼與後端自己的錯誤訊息
export class HttpError extends Error {
  constructor(status, serverMessage) {
    super(serverMessage || `HTTP ${status}`)
    this.name = 'HttpError'
    this.status = status
    this.serverMessage = serverMessage || ''
  }
}

const hasChinese = (s) => /[一-鿿]/.test(s || '')

export function friendlyError(e) {
  if (!e) return '發生錯誤，請稍後再試'
  const msg = String(e.message || '')

  if (e.name === 'HttpError') {
    if (e.status === 401 || e.status === 403) return '登入已過期，請重新登入'
    if (e.status === 413) return '照片太大，請換一張或重新裁切'
    // 502/503/504 是 Render 代理層在服務開機時回的，不是程式出錯。api.js 的 apiFetch
    // 已經自動重試過幾次了，還是這個狀態代表開機特別久——告訴使用者實情比「忙碌中」有用，
    // 他才知道「再等一下就好」而不是以為壞了。
    if (e.status === 502 || e.status === 503 || e.status === 504) return '伺服器正在喚醒中，請稍候約 30 秒再試一次'
    if (e.status >= 500) return '伺服器發生錯誤，請稍後再試'
    // 其他 4xx：後端訊息是中文（例如限流說明）就照用，否則給通用說法
    return hasChinese(e.serverMessage) ? e.serverMessage : '送出的資料有誤，請檢查後再試一次'
  }
  // 連不上伺服器：Chrome「Failed to fetch」、Safari「Load failed」、Firefox「NetworkError…」
  if (e.name === 'TypeError' && /fetch|load failed|network/i.test(msg)) return '無法連線，請檢查網路後再試一次'
  if (e.name === 'AbortError') return '連線逾時，請稍後再試'
  // Firestore
  if (e.code === 'permission-denied') return '沒有權限，請重新登入後再試'
  if (e.code === 'unavailable' || e.code === 'deadline-exceeded') return '無法連線，請檢查網路後再試一次'
  if (e.code === 'invalid-argument' && /bytes|size/i.test(msg)) return '照片太大，請換一張或重新裁切'
  // 我們自己丟的中文錯誤（例如「登入狀態已失效，請重新登入」）照用
  if (hasChinese(msg)) return msg
  return '發生錯誤，請稍後再試'
}
