import { displayTags } from '../data/tagTaxonomy'

// 把來源描述整理成「顯示用品名」。
// 警政署描述常是公告樣板：「拾得人拾獲：{品名}，請失主攜帶…前來認領」→ 去頭尾只留品名。
// 其他來源沒這些字樣，套用也無害（原樣返回）。
export function itemTitle(it) {
  // 沒有描述時退回第一個標籤；標籤可能是簡體，轉繁體（描述是原文，不轉，避免把「代表」「志工」這類字轉錯）
  let s = (it?.description || displayTags(it?.free_tags?.slice(0, 1))[0] || '').trim()
  s = s.replace(/^拾得人拾獲\s*[：:]\s*/, '') // 去「拾得人拾獲：」開頭
  s = s.split(/[，,]?\s*請失主/)[0]           // 砍「，請失主…」公告樣板
  return s.trim()
}

// 使用者常把「身分證」打成「身份證」。標籤表統一用「身分」，
// 所以送 AI 的描述、AI 回傳的標籤、搜尋關鍵字都先轉成「身分」，兩種寫法都能辨識、分類。
export function normalizeIdWording(text) {
  return typeof text === 'string' ? text.replaceAll('身份', '身分') : text
}
