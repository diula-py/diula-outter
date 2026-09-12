// 開發模式限定的除錯小工具：讓我們能在瀏覽器 Console 手動測 Firestore 資料層
// （addMyItem / listMyItems …），跳過還卡在 CORS 允許清單的 Spring /api/id-cards。
// import.meta.env.DEV 保護，正式 build 不會打包進去，也不用特地刪掉。
import { auth } from './firebase'
import { getOrCreateUserId } from './userId'
import { addMyItem, listMyItems, updateMyItem, getMyItem, removeMyItem } from './items'

if (import.meta.env.DEV) {
  window.__diula = {
    // 目前用 Google 登入測試時，直接從 Firebase Auth 拿 uid 換 user_id。
    async myUserId() {
      const u = auth.currentUser
      if (!u) {
        console.warn('[DiuLa Debug] 還沒登入 Google，先在畫面上登入再呼叫這個')
        return null
      }
      return getOrCreateUserId('G', u.uid)
    },
    addMyItem,
    listMyItems,
    updateMyItem,
    getMyItem,
    removeMyItem,
  }
  // eslint-disable-next-line no-console
  console.log('%c[DiuLa Debug] window.__diula 已掛上，可以手動測 Firestore 資料層', 'color:#06C755;font-weight:bold')
}
