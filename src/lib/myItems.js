// 「我的遺失物 / 協尋」本機紀錄（localStorage）。
// 之後接使用者後端就換成 API；現在先本機保存，讓發出去的協尋能出現在清單。
const KEY = 'diula_my_items'

export function loadItems() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
export function saveItems(arr) {
  try { localStorage.setItem(KEY, JSON.stringify(arr)) } catch { /* 滿了就略過 */ }
}
export function addItem(item) {
  const arr = loadItems()
  arr.unshift(item) // 新的排前面
  saveItems(arr)
  return item
}
export function updateItem(id, patch) {
  saveItems(loadItems().map((x) => (x.id === id ? { ...x, ...patch } : x)))
}
export function removeItem(id) {
  saveItems(loadItems().filter((x) => x.id !== id))
}
export function getItem(id) {
  return loadItems().find((x) => x.id === id)
}
