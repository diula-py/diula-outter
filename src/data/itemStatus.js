// 遺失／拾獲物件狀態列舉（全站共用，不要各頁面各自手打字串）。
// 遺失：尋找中（建立）→ 自動推播中（開訂閱）／已排定發文（送 Threads）→ 已找到
export const LOST_STATUS = {
  SEARCHING: '尋找中',
  BROADCASTING: '自動推播中',
  POSTED: '已排定發文',
  FOUND: '已找到',
}

// 拾獲：保管中 → 已找到
export const FOUND_STATUS = {
  KEEPING: '保管中',
  FOUND: '已找到',
}
