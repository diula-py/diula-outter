import { useEffect, useState } from 'react'
import { DiulaPinIcon } from './icons'

// 前 0.3 秒什麼都不畫：網路快時一閃就進去，不會看到 Logo 閃一下。
const SHOW_DELAY_MS = 300
// 等超過 5 秒才補一行提示（多半是 Render 後端冷啟動），讓使用者知道網頁還在跑。
const HINT_DELAY_MS = 5000

function useDelayedFlag(ms) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setOn(true), ms)
    return () => clearTimeout(t)
  }, [ms])
  return on
}

// 進站時等登入狀態（LIFF 初始化＋換 Firebase custom token）的全頁載入畫面：去背 Logo 呼吸動畫。
export default function LoadingScreen() {
  const visible = useDelayedFlag(SHOW_DELAY_MS)
  const showHint = useDelayedFlag(HINT_DELAY_MS)

  return (
    <div
      role="status"
      aria-label="載入中"
      className="relative flex min-h-[calc(100dvh-var(--top-inset))] flex-col items-center justify-center bg-paper text-brown"
    >
      {visible && <DiulaPinIcon className="h-[104px] w-auto animate-breathe motion-reduce:animate-none" />}
      <p
        className={`absolute bottom-[calc(50%-112px)] text-[13px] transition-opacity duration-500 ${
          showHint ? 'opacity-60' : 'opacity-0'
        }`}
      >
        正在連線，請稍候
      </p>
    </div>
  )
}

// 列表／內容區的小載入動畫（48px），取代原本的「載入中…」文字；標題列還在，所以不加提示字。
// 外層若是 grid（手機橫放兩欄），className 傳 land:col-span-full 讓它跨欄置中。
export function LoadingInline({ className = '' }) {
  const visible = useDelayedFlag(SHOW_DELAY_MS)
  return (
    <div role="status" aria-label="載入中" className={`flex h-[128px] items-center justify-center ${className}`}>
      {visible && <DiulaPinIcon className="h-12 w-auto animate-breathe motion-reduce:animate-none" />}
    </div>
  )
}
