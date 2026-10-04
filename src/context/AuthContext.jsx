import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { getOrCreateUserId } from '../lib/userId'
import { fetchLineCustomToken, LINE_UID_PREFIX } from '../lib/authToken'
import {
  initLiff,
  isLiffLoggedIn,
  getLiffProfile,
  loginWithLine as liffLoginWithLine,
  logoutLine,
} from '../lib/liff'

// user 形狀：{ provider: 'line' | 'google', uid, userId, displayName, photoURL, email }
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  const resolveFromLine = useCallback(async () => {
    if (!isLiffLoggedIn()) return null
    const profile = await getLiffProfile()
    // ⚠️ 順序很重要：要先有 Firebase 登入狀態，才能碰 Firestore。firestore.rules 要求
    // request.auth != null；如果等到 getOrCreateUserId 之後才登入，那筆讀寫會被規則擋掉
    // → 退回「用當下年月重算 user_id」的舊 bug，使用者換月登入後既有物品全部查不到。
    //
    // 這裡用後端簽的 custom token 登入，uid 固定是 line_<LINE userId>，所以 Firestore
    // 規則可以寫 owner_uid == request.auth.uid。以前用 signInAnonymously() 拿到的是隨機
    // uid，規則只能寫 request.auth != null，而匿名帳號誰都能開 → 等於沒鎖。
    const expectedUid = LINE_UID_PREFIX + profile.userId
    if (auth.currentUser?.uid !== expectedUid) {
      try {
        const customToken = await fetchLineCustomToken()
        if (!customToken) throw new Error('後端沒有回傳 custom token')
        await signInWithCustomToken(auth, customToken)
      } catch (e) {
        // 後端睡著（Render 冷啟動 ~50 秒）或暫時掛掉時，不要讓使用者整個登不進來。
        // 退回匿名登入：功能照舊，只是這個 session 寫入的資料蓋不到正確的 owner_uid。
        console.warn('換 Firebase custom token 失敗，退回匿名登入：', e)
        if (!auth.currentUser) {
          try {
            await signInAnonymously(auth)
          } catch (e2) {
            console.warn('Firebase 匿名登入失敗:', e2)
          }
        }
      }
    }
    // 識別使用者身分一律以 LINE userId 為準，不使用 Firebase uid。
    const userId = await getOrCreateUserId('L', profile.userId)
    return {
      provider: 'line',
      uid: profile.userId,
      userId,
      displayName: profile.displayName || 'LINE 使用者',
      photoURL: profile.pictureUrl || null,
      // LIFF 的 ID token 預設不含 email，所以 LINE 使用者沒有可驗證的信箱。
      // 後端的 Email 訂閱會因此擋下他們（見 diula-outter/auth_token.py）。
      email: null,
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        await initLiff()
      } catch (e) {
        // LIFF 初始化失敗不擋 Google 登入流程（例如不是在 LINE 環境開啟）。
      }

      const lineUser = await resolveFromLine().catch(() => null)
      if (cancelled) return
      if (lineUser) {
        setUser(lineUser)
        setLoading(false)
      }
      // 沒有 LINE 登入 → 交給下面的 onAuthStateChanged 判斷 Google 登入狀態，
      // 它會在初次呼叫時就把 loading 收尾。
    }

    bootstrap()

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (cancelled) return
      if (isLiffLoggedIn()) return // LINE 優先，已在 bootstrap 處理過

      if (
        fbUser &&
        !fbUser.isAnonymous &&
        fbUser.providerData.some((p) => p.providerId === 'google.com')
      ) {
        const userId = await getOrCreateUserId('G', fbUser.uid)
        if (cancelled) return
        setUser({
          provider: 'google',
          uid: fbUser.uid,
          userId,
          displayName: fbUser.displayName || 'Google 使用者',
          photoURL: fbUser.photoURL || null,
          email: fbUser.emailVerified ? fbUser.email : null,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [resolveFromLine])

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const fbUser = result.user
    const userId = await getOrCreateUserId('G', fbUser.uid)
    setUser({
      provider: 'google',
      uid: fbUser.uid,
      userId,
      displayName: fbUser.displayName || 'Google 使用者',
      photoURL: fbUser.photoURL || null,
      email: fbUser.emailVerified ? fbUser.email : null,
    })
    return userId
  }, [])

  const loginWithLine = useCallback(() => {
    liffLoginWithLine()
  }, [])

  const logout = useCallback(async () => {
    if (user?.provider === 'line') {
      logoutLine()
    } else {
      await firebaseSignOut(auth)
    }
    setUser(null)
  }, [user])

  const value = {
    user,
    userId: user?.userId ?? null,
    loading,
    loginWithGoogle,
    loginWithLine,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必須在 AuthProvider 裡使用')
  return ctx
}
