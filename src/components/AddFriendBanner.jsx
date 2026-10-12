import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { initLiff, isLiffLoggedIn, isLineOaFriend, LINE_OA_ADD_FRIEND_URL } from '../lib/liff'
import { XmarkIcon } from './icons'

// 舊用戶早就授權過 LINE Login，同意畫面不會再出現，也就不會被提示加官方帳號（推播只送得到好友）。
// 所以 LINE 登入、還沒加好友的人在首頁補一張提示卡；按 ✕ 之後這支手機 7 天內不再顯示。
// Google 登入、離線、查詢失敗一律不顯示，寧可漏提示也不要誤判。
const DISMISSED_KEY = 'diula_add_friend_dismissed_at'
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY))
    return at > 0 && Date.now() - at < DISMISS_MS
  } catch {
    return false
  }
}

export default function AddFriendBanner() {
  const { user } = useAuth()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (user?.provider !== 'line' || !navigator.onLine || dismissedRecently()) return
    let cancelled = false
    initLiff()
      .then(() => (isLiffLoggedIn() ? isLineOaFriend() : true))
      .then((isFriend) => {
        if (!cancelled && !isFriend) setShow(true)
      })
      .catch((e) => console.warn('查詢官方帳號好友狀態失敗：', e))
    return () => {
      cancelled = true
    }
  }, [user?.provider])

  function dismiss() {
    setShow(false)
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    } catch {
      /* storage 不能用就只在這次隱藏 */
    }
  }

  if (!show) return null

  return (
    <section className="relative mt-[25px] flex w-[calc(100%-40px)] max-w-[350px] flex-col items-center gap-[10px] rounded-[20px] border border-black bg-card px-5 py-[15px] text-center text-brown
                        land:col-span-full land:mt-3 land:max-w-[708px] land:flex-row land:justify-center land:gap-5 land:py-[10px] land:text-left">
      <button
        type="button"
        onClick={dismiss}
        aria-label="關閉"
        className="absolute right-[10px] top-[10px] flex h-6 w-6 items-center justify-center rounded-full
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
      >
        <XmarkIcon className="h-4 w-4" />
      </button>
      <div className="text-base font-medium">加入 DiuLa! 官方帳號好友</div>
      <div className="text-xs font-medium">物品有新消息時才收得到 LINE 通知</div>
      <a
        href={LINE_OA_ADD_FRIEND_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-10 items-center rounded-[50px] border border-black bg-blue px-6 text-base font-medium text-brown no-underline
                   transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
      >
        加入好友
      </a>
    </section>
  )
}
