// 遺失／拾獲物件狀態列舉（全站共用，不要各頁面各自手打字串）。
// 遺失：尋找中（建立）→ 自動推播中（開訂閱）／已發文（送 Threads）→ 已找到
// 自動推播中滿五天 → 結束自動推播（由 Cloud Function expireAutoPush 每小時檢查並停訂閱）
export const LOST_STATUS = {
  SEARCHING: '尋找中',
  BROADCASTING: '自動推播中',
  BROADCAST_ENDED: '結束自動推播',
  POSTED: '已發文',
  FOUND: '已找到',
}

// 舊字：2026-10 以前（以及 inner 網站）寫進資料庫的是「已排定發文」。
// 資料庫不改，讀出來時（items.js toPlainItem）一律當成 LOST_STATUS.POSTED 顯示。
export const LEGACY_LOST_STATUS = {
  '已排定發文': LOST_STATUS.POSTED,
}

// 拾獲：保管中 → 已找到
export const FOUND_STATUS = {
  KEEPING: '保管中',
  FOUND: '已找到',
}
