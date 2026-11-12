// 新手教學（components/OnboardingTour.jsx）的「看過了」紀錄：記在人身上，不記在裝置上。
// 2026-11-13 定案：登入後第一次進首頁跳出，所有人（含舊使用者）都看一次；
// 紀錄寫在 Firestore onboarding_seen/{Firebase uid}，換手機也不會再跳。
// 展覽共用手機時，每個新登入的人都會看到一次。
//
// 另外在這支手機的 localStorage 記一份（key 帶 uid），同一個人下次打開不用再等 Firestore；
// Firestore 規則還沒發布、寫入失敗時，至少這支手機不會每次都跳。
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { getOwnerUid } from './authToken'

// 教學內容大改（例如 PM 給最終版、要讓大家重看）時把版本加一，所有人會再看一次。
export const ONBOARDING_VERSION = 1

const LOCAL_KEY_PREFIX = 'diula_onboarding_seen_'
const OPEN_EVENT = 'diula:open-onboarding'

function readLocal(uid) {
  try {
    return Number(localStorage.getItem(LOCAL_KEY_PREFIX + uid)) || 0
  } catch {
    return 0
  }
}

function writeLocal(uid) {
  try {
    localStorage.setItem(LOCAL_KEY_PREFIX + uid, String(ONBOARDING_VERSION))
  } catch {
    /* 無痕模式等存不了：還有 Firestore 那份 */
  }
}

/**
 * 這個人要不要自動跳出教學。user 為 AuthContext 的 user。
 * 離線、或還換不到 Firebase 身分時回 false：寧可這次不跳、下次再判斷，也不要每次都跳。
 */
export async function shouldShowOnboarding(user) {
  if (!user?.uid) return false
  if (readLocal(user.uid) >= ONBOARDING_VERSION) return false
  try {
    const ownerUid = await getOwnerUid()
    const snap = await getDoc(doc(db, 'onboarding_seen', ownerUid))
    if (snap.exists() && (snap.data().version ?? 0) >= ONBOARDING_VERSION) {
      writeLocal(user.uid)
      return false
    }
    return true
  } catch (e) {
    // permission-denied：Firestore 規則還沒發布 → 只靠本機紀錄判斷（上面已確認本機沒看過）
    if (e?.code === 'permission-denied') return true
    // 離線（unavailable）、登入還沒完成等：這次先不跳
    console.warn('讀取新手教學紀錄失敗，這次先不顯示：', e)
    return false
  }
}

/** 按「跳過」或「開始使用」時呼叫。寫入失敗只記 log，不影響使用。 */
export async function markOnboardingSeen(user) {
  if (!user?.uid) return
  writeLocal(user.uid)
  try {
    const ownerUid = await getOwnerUid()
    await setDoc(doc(db, 'onboarding_seen', ownerUid), {
      version: ONBOARDING_VERSION,
      seen_at: serverTimestamp(),
    })
  } catch (e) {
    console.warn('寫入新手教學紀錄失敗：', e)
  }
}

/** 個人頁「使用教學」連結：叫 AppLayout 裡的 OnboardingGate 打開教學。 */
export function openOnboarding() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function onOpenOnboarding(handler) {
  window.addEventListener(OPEN_EVENT, handler)
  return () => window.removeEventListener(OPEN_EVENT, handler)
}
