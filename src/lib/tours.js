// 「尋找使用教學」「拾獲使用教學」（聚光燈導覽）與頁面內小提示的「看過了」紀錄。
// 2026-11-16 開會定案：
//   - 尋找使用教學：第一次進到「尋找」分頁時跳一次；第一個使用教學結束後直接接上。之後只能點問號重看。
//   - 拾獲使用教學：第一次切到「拾獲」分頁時跳一次，之後只能點問號重看。
//   - 小提示：確認標籤頁（尋找、拾獲各一）、「都沒有我的物品」（跨平台結果頁、近 2 日快速看各一），每個只出現一次。
//
// 紀錄記在人身上（使用者 2026-11-16 指定，跟第一個使用教學一樣）：
// Firestore tour_seen/{Firebase uid}，欄位是 SEEN_NAMES 裡的名字、值一律 true，換手機也不會再跳。
// 這支手機的 localStorage 也記一份（key 帶 uid），畫面判斷都看這份，打開 App 時先跟 Firestore 同步一次。
// ⚠ 規則要在 Firebase Console 發布（firestore.rules 的 tour_seen 段）；還沒發布前讀寫會 permission-denied，
//   這時只靠本機紀錄，功能照常。
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { getOwnerUid } from './authToken'

// 小提示文案（2026-11-16 開會定案）
export const TIP_TAGS = 'AI 標籤可以修改：點 × 拿掉不對的，按「新增」補上更準確的類別。'
export const TIP_NOT_MINE = '沒有找到嗎？點這裡可以開啟5日持續自動尋找並推播，或請 DiuLa! 幫你在 Threads 發匿名協尋文。'

// Firestore 規則只收這幾個欄位名，新增教學或提示時兩邊要一起加
export const SEEN_NAMES = [
  'tour_find', 'tour_found',
  'tip_tags_find', 'tip_tags_found',
  'tip_not_mine_results', 'tip_not_mine_recent',
]

const PREFIX = 'diula_seen_'
const OPEN_EVENT = 'diula:open-tour'
const COLLECTION = 'tour_seen'

const keyOf = (name, uid) => `${PREFIX}${name}_${uid || 'anon'}`

function writeLocal(name, uid) {
  try {
    localStorage.setItem(keyOf(name, uid), '1')
  } catch {
    /* 無痕模式等存不了：還有 Firestore 那份 */
  }
}

export function isSeen(name, uid) {
  try {
    return localStorage.getItem(keyOf(name, uid)) === '1'
  } catch {
    return false
  }
}

let loadedUid = null
let loading = null

/**
 * 打開 App 時把帳號上的紀錄同步到本機（每個 uid 只抓一次）。
 * 回傳 true：可以照本機紀錄判斷；false：離線等原因沒同步到，這次先不要自動跳，免得在別支手機看過還再跳。
 */
export function loadSeen(uid) {
  if (!uid) return Promise.resolve(false)
  if (loadedUid === uid && loading) return loading
  loadedUid = uid
  loading = (async () => {
    try {
      const ownerUid = await getOwnerUid()
      const snap = await getDoc(doc(db, COLLECTION, ownerUid))
      if (snap.exists()) {
        for (const [name, value] of Object.entries(snap.data())) {
          if (value === true) writeLocal(name, uid)
        }
      }
      return true
    } catch (e) {
      // 規則還沒發布：只靠本機紀錄
      if (e?.code === 'permission-denied') return true
      console.warn('讀取使用教學紀錄失敗，這次先不自動顯示：', e)
      loading = null // 下次再試
      return false
    }
  })()
  return loading
}

/** 看完／按「知道了」時呼叫。寫入失敗只記 log，不影響使用。 */
export async function markSeen(name, uid) {
  writeLocal(name, uid)
  try {
    const ownerUid = await getOwnerUid()
    await setDoc(doc(db, COLLECTION, ownerUid), { [name]: true }, { merge: true })
  } catch (e) {
    console.warn('寫入使用教學紀錄失敗：', e)
  }
}

/** 問號鈕等地方：叫 AppLayout 裡的 OnboardingGate 打開「find」或「found」導覽。 */
export function openTour(name) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: name }))
}

export function onOpenTour(handler) {
  const listener = (e) => handler(e.detail)
  window.addEventListener(OPEN_EVENT, listener)
  return () => window.removeEventListener(OPEN_EVENT, listener)
}

/** 依 data 屬性找畫面上「看得到」的那一個元素（手機版／桌機版各有一份，另一份是 display:none）。 */
export function findVisible(attr, id) {
  const els = document.querySelectorAll(`[${attr}="${id}"]`)
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return el
  }
  return null
}
