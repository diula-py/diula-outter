// 協尋文審核狀態的回寫。
//
// 為什麼要在前端做：核准／退件是管理者在小後台（/admin）按的，按下去的是 Flask，
// 而「我的遺失物」那筆資料在 diula--test 專案——Render 上的 Flask 只掛了 comparison
// 的金鑰，改不到它（同 /subscriptions 的限制）。所以由前端進詳情頁時問一次後端，
// 自己把狀態補上。問不到（離線、後端在睡、404）就維持原狀，下次再問。
import { fetchSosStatus } from './api'
import { updateMyItem } from './items'
import { LOST_STATUS } from '../data/itemStatus'

// 回傳要套用到畫面上的欄位（已經一併寫進 Firestore），沒變化就回 null。
export async function syncSosReview(item) {
  if (!item?.id || item.status !== LOST_STATUS.REVIEWING) return null

  let res
  try {
    res = await fetchSosStatus({ lostId: item.id, reviewId: item.sos_review_id })
  } catch {
    return null   // 還在審、查不到、連不上——都不是要處理的狀況，保持「審核中」
  }

  let patch = null
  if (res.status === 'posted' && res.post_id) {
    patch = {
      status: LOST_STATUS.POSTED,
      thread_post_id: res.post_id,
      thread_post_url: res.permalink || '',
      sos_review_id: null,
    }
  } else if (res.status === 'rejected') {
    // 退回「尋找中」，使用者改過內容後可以再送一次；原因留著給詳情頁顯示。
    patch = {
      status: LOST_STATUS.SEARCHING,
      sos_review_reason: res.reason || '',
      sos_review_id: null,
    }
  }
  if (!patch) return null

  await updateMyItem('lost', item.id, patch).catch(() => {})
  return patch
}
