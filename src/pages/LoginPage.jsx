import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { asset } from '../lib/asset'
import { useAuth } from '../context/AuthContext'

function GoogleGIcon(props) {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

export default function LoginPage() {
  const { user, loading, loginWithLine, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')

  // 已經是登入狀態（例如重新整理後恢復 session）就直接跳回原本要去的頁面。
  useEffect(() => {
    if (!loading && user) {
      const dest = location.state?.from?.pathname || '/'
      navigate(dest, { replace: true })
    }
  }, [loading, user, location, navigate])

  async function handleGoogleLogin() {
    setError('')
    try {
      await loginWithGoogle()
    } catch (e) {
      console.error('Google 登入失敗:', e)
      setError('登入失敗：' + (e?.message || '未知錯誤'))
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-blue px-6 pt-[calc(env(safe-area-inset-top)+120px)]">
      <div className="flex h-[128px] w-full items-center justify-center overflow-hidden">
        <img src={asset('/icons/diula-logo.png')} alt="DiuLa!" className="w-full" />
      </div>

      <p className="mt-8 text-2xl font-medium text-brown">與失物重逢的捷徑</p>

      <div className="mt-16 flex w-full max-w-[290px] flex-col gap-4">
        <button
          type="button"
          onClick={loginWithLine}
          className="flex h-[62px] w-full items-center justify-center gap-3 rounded-[50px] bg-[#06C755] text-lg font-bold text-white transition hover:brightness-95 active:scale-[.99]"
        >
          <img src={asset('/icons/line-login.png')} alt="" className="h-7 w-7" />
          <span>使用 LINE 登入</span>
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex h-[62px] w-full items-center justify-center gap-3 rounded-[50px] border border-[#747775] bg-white text-lg font-bold text-[#3C4043] transition hover:bg-[#f8f8f8] active:scale-[.99]"
        >
          <GoogleGIcon className="h-6 w-6 shrink-0" />
          <span>使用 Google 登入</span>
        </button>
      </div>

      {error && <p className="mt-4 text-center text-sm text-error">{error}</p>}

      <a
        href="mailto:diula.112ics@gmail.com"
        className="mt-10 text-base text-black opacity-50"
      >
        遇到問題嗎？
      </a>
      <p className="mt-4 max-w-[264px] text-center text-xs text-black opacity-50">
        登入即代表您同意本平台的服務條款與隱私權政策
      </p>
    </div>
  )
}
