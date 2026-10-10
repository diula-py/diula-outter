import liff, { isLiffLoggedIn } from './liff'
import { auth } from './firebase'
import { spring } from './api'

// 打後端寫入／讀取個資的 API 時要附上的登入憑證。
// 後端（diula-api 的 TokenAuth）吃兩種：LINE 的 ID token、Firebase 的 ID token，
// 用 X-Auth-Provider 告訴它是哪一種，省掉一次多餘的驗證。
//
// ⚠️ Firebase 匿名帳號不算登入，後端會擋掉，所以這裡也直接跳過 isAnonymous 的使用者。
export async function getAuthHeaders() {
  try {
    if (isLiffLoggedIn()) {
      const token = liff.getIDToken()
      if (token) {
        return { Authorization: `Bearer ${token}`, 'X-Auth-Provider': 'line' }
      }
    }
  } catch {
    /* LIFF 沒 init 成功就走下面的 Firebase */
  }

  const user = auth.currentUser
  if (user && !user.isAnonymous) {
    const token = await user.getIdToken()
    return { Authorization: `Bearer ${token}`, 'X-Auth-Provider': 'firebase' }
  }
  return null
}

// LINE 使用者的 Firebase uid 固定長這樣（與後端 AuthController.LINE_UID_PREFIX 一致）。
// 改這個前綴等於改掉所有既有資料的 owner_uid，別亂動。
export const LINE_UID_PREFIX = 'line_'

// LINE 登入時換 custom token 那段可能還在背景跑（AuthContext 最多只等 8 秒就先放行畫面）。
// 讀寫 Firestore 前要等它跑完，request.auth.uid 才會是 line_xxx，規則才認得出你是主人。
let pendingOwnerSignIn = Promise.resolve()
export function trackOwnerSignIn(promise) {
  pendingOwnerSignIn = promise.catch(() => {})
}

// 最多等多久。Render 冷啟動約 50 秒，再多給一點。
const OWNER_SIGN_IN_WAIT_MS = 70000

// 回傳目前登入者在 Firestore 規則裡的身分（request.auth.uid），也就是物品的 owner_uid。
// 還沒換到正式身分（沒登入、或只有匿名帳號）就丟錯，不要用錯的身分去讀寫。
export async function getOwnerUid() {
  await auth.authStateReady()
  await Promise.race([
    pendingOwnerSignIn,
    new Promise((resolve) => setTimeout(resolve, OWNER_SIGN_IN_WAIT_MS)),
  ])
  const user = auth.currentUser
  if (!user || user.isAnonymous) throw new Error('登入尚未完成，請重新整理後再試一次')
  return user.uid
}

// 用 LINE 的 ID token 跟後端換一個 Firebase custom token。
// 換到之後 signInWithCustomToken() 登入，request.auth.uid 才是可信的身分，
// Firestore 規則才能判斷「這筆資料是不是你的」（見 diula-api 的 AuthController）。
export async function fetchLineCustomToken() {
  const headers = await getAuthHeaders()
  if (!headers || headers['X-Auth-Provider'] !== 'line') return null
  const res = await fetch(spring('/api/auth/firebase-token'), { method: 'POST', headers })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || `HTTP ${res.status}`)
  }
  const json = await res.json()
  return json.custom_token || null
}
