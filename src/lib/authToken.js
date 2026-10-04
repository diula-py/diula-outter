import liff, { isLiffLoggedIn } from './liff'
import { auth } from './firebase'
import { spring } from './api'

// 打後端寫入／讀取個資的 API 時要附上的登入憑證。
// 後端（diula-api 的 TokenAuth）吃兩種：LINE 的 ID token、Firebase 的 ID token，
// 用 X-Auth-Provider 告訴它是哪一種，省掉一次多餘的驗證。
//
// ⚠️ Firebase 匿名帳號不算登入（AuthContext 會替 LINE 使用者背景補一個），後端會擋掉，
// 所以這裡也直接跳過 isAnonymous 的使用者。
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
