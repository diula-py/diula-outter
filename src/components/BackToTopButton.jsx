import { useEffect, useState } from 'react'
import { ChevronDownIcon } from './icons'

/**
 * 「回到頂部」圓鈕（比對結果頁、Threads 尋找遺失物頁共用）：白底 50×50、黑框、陰影，
 * 右緣對齊卡片欄（340）。往下滑超過一個螢幕高才淡入，回到一個螢幕高以內就收起；點了平滑捲回頂端。
 * bottomClass：離視窗底部多高（要寫完整的 Tailwind class，Tailwind 才產得出來）。
 * widthClass：外層容器的寬度／內距（預設手機版卡片欄 340），桌機版呼叫端可以傳
 * 1280 置中欄的寬度＋px-10，讓按鈕跟著貼齊內容欄右緣，不用為了桌機另外寫一顆。
 * forceHide：呼叫端自己判斷「頁尾快捲進畫面了」之類的情況，不管捲動位置強制收起
 * （避免蓋到頁尾，見 ResultsPage 的 footerNear）。
 */
export default function BackToTopButton({ bottomClass, widthClass = 'w-[calc(100%-40px)] max-w-[340px]', forceHide = false }) {
  const [scrolled, setScrolled] = useState(false)
  const show = scrolled && !forceHide
  useEffect(() => {
    function check() {
      setScrolled(window.scrollY > window.innerHeight)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return (
    <div className={`pointer-events-none fixed left-1/2 z-[90] flex -translate-x-1/2 justify-end box-border ${widthClass} ${bottomClass}`}>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="回到頂部"
        aria-hidden={!show}
        tabIndex={show ? 0 : -1}
        className={`box-border flex h-[50px] w-[50px] items-center justify-center rounded-full border border-black bg-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]
                    transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                    ${show ? 'pointer-events-auto translate-y-0 opacity-100' : 'translate-y-[10px] opacity-0'}`}
      >
        <ChevronDownIcon className="h-6 w-6 rotate-180" />
      </button>
    </div>
  )
}
