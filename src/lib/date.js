// 當天日期字串 YYYY-MM-DD（本地時區）。
// 用本地年月日組字串，不用 toISOString()——後者是 UTC，台灣深夜會變成前一天。
export function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
