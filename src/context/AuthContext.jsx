import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { getOrCreateUserId } from '../lib/userId'
import {
  initLiff,
  isLiffLoggedIn,
  getLiffProfile,
  loginWithLine as liffLoginWithLine,
  logoutLine,
} from '../lib/liff'

// user 形狀：{ provider: 'line' | 'google', uid, userId, displayName, photoURL }
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  const resolveFromLine = useCallback(async () => {
    if (!isLiffLoggedIn()) return null
    const profile = await getLiffProfile()
    const userId = await getOrCreateUserId('L', profile.userId)
    // Firestore 規則仍可能需要 Firebase 的登入狀態，背景補一個匿名帳號；
    // 識別使用者身分一律以 LINE userId 為準，不使用這個匿名帳號的 uid。
    if (!auth.currentUser) {
      try {
        await signInAnonymously(auth)
      } catch (e) {
        console.warn('Firebase 匿名登入失敗:', e)
      }
    }
    return {
      provider: 'line',
      uid: profile.userId,
      userId,
      displayName: profile.displayName || 'LINE 使用者',
      photoURL: profile.pictureUrl || null,
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
