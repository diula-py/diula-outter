// 把來源描述整理成「顯示用品名」。
// 警政署描述常是公告樣板：「拾得人拾獲：{品名}，請失主攜帶…前來認領」→ 去頭尾只留品名。
// 其他來源沒這些字樣，套用也無害（原樣返回）。
export function itemTitle(it) {
  let s = (it?.description || it?.free_tags?.[0] || '').trim()
  s = s.replace(/^拾得人拾獲\s*[：:]\s*/, '') // 去「拾得人拾獲：」開頭
  s = s.split(/[，,]?\s*請失主/)[0]           // 砍「，請失主…」公告樣板
  return s.trim()
}
