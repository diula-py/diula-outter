// 「發協尋文」與「開自動推播」只能擇一：其中一個成功後，記下這筆遺失物已處理過。
// 瀏覽紀錄裡更早的「確認標籤／比對結果」刪不掉，使用者用返回鍵／手勢退回去時，
// 這兩頁一打開就檢查，處理過就直接換成首頁，不讓他再選另一個。
// 記在 sessionStorage（只在這個分頁有效，瀏覽紀錄也只在這個分頁），讀寫失敗（無痕、被擋）就當沒記。
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const KEY = 'diula_handled_lost_ids'

function readIds() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function markLostHandled(id) {
  if (!id) return
  try {
    const ids = readIds()
    if (!ids.includes(id)) sessionStorage.setItem(KEY, JSON.stringify([...ids, id]))
  } catch {
    /* 存不了就算了，只是少了這層防護 */
  }
}

// 回傳 true 時頁面應該直接 return null（避免閃一下），同時會換成首頁。
export function useLeaveIfHandled(lostId) {
  const navigate = useNavigate()
  const handled = !!lostId && readIds().includes(lostId)
  useEffect(() => {
    if (handled) navigate('/', { replace: true })
  }, [handled, navigate])
  return handled
}
