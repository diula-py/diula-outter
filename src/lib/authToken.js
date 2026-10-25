import { signInWithCustomToken } from 'firebase/auth'
import liff, { isLiffLoggedIn } from './liff'
import { auth } from './firebase'
import { spring, apiFetch } from './api'
import { HttpError } from './errors'

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

// 已經換到正式身分了嗎（匿名帳號不算）。
function hasOwnerIdentity() {
  const user = auth.currentUser
  return !!user && !user.isAnonymous
}

// 每次嘗試的逾時。自己用 AbortController 控，不靠瀏覽器預設值：Safari 是 60 秒，
// 比 Render 的冷啟動還短 →「叫醒後端的那一次請求」會先被瀏覽器砍掉，登入就失敗了
// （2026-10-12 實際症狀：Console 出現 `要求逾時` + `TypeError: Load failed`）。
// 刻意遞增：前兩次短，快速確認後端是不是醒著；最後一次留長的等它開完機。
const TOKEN_ATTEMPT_TIMEOUTS_MS = [20000, 30000, 45000]

// 後端明確拒絕（憑證不對、限流、參數錯）就不要重送，再送一次一樣會被拒。
// 只有逾時、連不上、5xx 這種「可能只是還在開機」的狀況才值得重試。
function worthRetrying(e) {
  if (e instanceof HttpError) return e.status >= 500
  return true
}

// 進行中的那一輪，避免同時跑兩輪（畫面載入時一輪、存檔前又補一輪）。
let ownerSignIn = null

// LINE 登入時換 custom token 那段可能還在背景跑（AuthContext 最多只等 8 秒就先放行畫面）。
// 讀寫 Firestore 前要等它跑完，request.auth.uid 才會是 line_xxx，規則才認得出你是主人。
let pendingOwnerSignIn = Promise.resolve()

// 跟後端換 custom token 並登入 Firebase。同一時間只會有一輪在跑；跑完就放掉，
// 下次呼叫（例如存檔前發現還沒有身分）會重新送一輪。
export function signInAsLineOwner() {
  if (!ownerSignIn) {
    const run = runOwnerSignIn()
    ownerSignIn = run
    // 自己吞掉錯誤，不要多生一個沒人接的 rejected promise；錯誤留給 return 出去的那個。
    run.catch(() => {}).finally(() => {
      if (ownerSignIn === run) ownerSignIn = null
    })
    pendingOwnerSignIn = run.catch(() => {})
  }
  return ownerSignIn
}

async function runOwnerSignIn() {
  let lastError = null
  for (let i = 0; i < TOKEN_ATTEMPT_TIMEOUTS_MS.length; i++) {
    try {
      const customToken = await fetchLineCustomToken(TOKEN_ATTEMPT_TIMEOUTS_MS[i])
      if (!customToken) throw new Error('後端沒有回傳 custom token')
      return await signInWithCustomToken(auth, customToken)
    } catch (e) {
      lastError = e
      if (!worthRetrying(e) || i === TOKEN_ATTEMPT_TIMEOUTS_MS.length - 1) throw e
      console.warn(`換 Firebase custom token 第 ${i + 1} 次沒成功，再送一次：`, e)
    }
  }
  throw lastError
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

  let retryError = null
  if (!hasOwnerIdentity()) {
    // 背景那一輪多半是被冷啟動拖垮的——它本身就是叫醒後端的那次請求。
    // 走到這裡（使用者已經填完表、按下送出）後端通常早就開完機了，再送一次就會成功，
    // 不要直接叫人家重新整理、把填好的東西丟掉。
    try {
      await signInAsLineOwner()
    } catch (e) {
      retryError = e
      console.warn('送出前補換 Firebase custom token 仍失敗：', e)
    }
  }

  const user = auth.currentUser
  if (!user || user.isAnonymous) {
    // 後端明確說憑證不對（LINE ID token 過期之類）→ 重新整理沒有用，要重新登入。
    // 講錯的話使用者會一直重整、一直失敗，也查不出原因。
    if (retryError instanceof HttpError && (retryError.status === 401 || retryError.status === 403)) {
      throw new Error('登入已過期，請重新登入')
    }
    throw new Error('登入尚未完成，請重新整理後再試一次')
  }
  return user.uid
}

// 用 LINE 的 ID token 跟後端換一個 Firebase custom token。
// 換到之後 signInWithCustomToken() 登入，request.auth.uid 才是可信的身分，
// Firestore 規則才能判斷「這筆資料是不是你的」（見 diula-api 的 AuthController）。
export async function fetchLineCustomToken(timeoutMs) {
  const headers = await getAuthHeaders()
  if (!headers || headers['X-Auth-Provider'] !== 'line') return null
  const ctrl = new AbortController()
  const timer = timeoutMs ? setTimeout(() => ctrl.abort(), timeoutMs) : null
  try {
    const res = await apiFetch(spring('/api/auth/firebase-token'), {
      method: 'POST',
      headers,
      signal: ctrl.signal,
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new HttpError(res.status, json.error)
    }
    const json = await res.json()
    return json.custom_token || null
  } finally {
    if (timer) clearTimeout(timer)
  }
}

// 登出時撤銷這個帳號全部的 refresh token（見 diula-api 的 AuthController./auth/revoke）。
// 不管是 Google 登入還是 LINE（custom token）登入，auth.currentUser 這時候都是真正的
// Firebase 身分，直接拿它的 idToken 打，不用分流。
//
// 為什麼要在清掉本機狀態「之前」呼叫：這支端點要靠當下這個 idToken 才能證明是本人，
// 一旦 signOut() 跑完、auth.currentUser 變 null，就再也叫不到自己的 token 了。
// 失敗（網路、後端睡著）不拋出，不該讓使用者卡在登出不了。
export async function revokeFirebaseToken() {
  const user = auth.currentUser
  if (!user || user.isAnonymous) return
  try {
    const token = await user.getIdToken()
    await apiFetch(spring('/api/auth/revoke'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'X-Auth-Provider': 'firebase' },
    })
  } catch (e) {
    console.warn('登出時撤銷 token 失敗（不影響登出本身）：', e)
  }
}
