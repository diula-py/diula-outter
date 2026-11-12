import { useCallback, useEffect, useRef, useState } from 'react'
import { asset } from '../lib/asset'
import { useStatusBarColor } from '../lib/statusBarOverride'
import { Backdrop } from './DialogKit'

/**
 * 新手教學：全螢幕、可左右滑的卡片（2026-11 開會定案：草稿的「樣式 A」，底色用彈窗的米色）。
 * 什麼時候跳出、看過紀錄怎麼存，見 OnboardingGate.jsx 與 lib/onboarding.js。
 *
 * 卡片順序 1→2→4→3（開會定案）。文案是暫定的，PM 之後會給最終版，改 CARDS 就好。
 * 鈴鐺是佔位圖示，美術之後會給動畫；放大鏡、小人是美術給的動畫 SVG
 * （CSS keyframes 寫在 SVG 裡，要用 <img> 載入才會動，見 diula_find_magnifier／diula_pick_stand 的 README）。
 *
 * 按鈕比照彈窗的 DialogButton：60 高、圓角 50、1px 黑框、咖啡色字 20/500；
 * 「上一步」白底、「下一步／開始使用」藍底。
 */

function BellArt() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="#492c13" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" className="h-32 w-32 land:h-16 land:w-16">
      <path d="M20 44V30a12 12 0 0 1 24 0v14l4 5H16z" fill="#fff" />
      <path d="M27 53a5 5 0 0 0 10 0" />
      <path d="M32 12v6" />
      <circle cx="47" cy="17" r="5" fill="#492c13" stroke="none" />
    </svg>
  )
}

// 淺藍圓底（設計稿草稿 210px，換算實際尺寸約 260）
function Blob({ children }) {
  return (
    <div className="flex h-[260px] w-[260px] items-center justify-center rounded-full bg-blue land:h-[120px] land:w-[120px]">
      {children}
    </div>
  )
}

const CARDS = [
  {
    title: '歡迎加入 DiuLa!',
    body: '一站式 AI 遺失物協尋平台。底部有「拾獲」「尋找」「個人」三個分頁。',
    art: <img src={asset('/icons/diula-logo-cropped.png')} alt="" className="w-[270px] land:w-[180px]" />,
  },
  {
    title: '東西不見了？',
    body: '到「尋找」分頁拍一張照片，AI 幫你跨平台比對拾獲物。',
    art: (
      <Blob>
        <img src={asset('/icons/illustration-search.svg')} alt="" draggable={false}
          className="h-[235px] w-[235px] select-none land:h-[108px] land:w-[108px]" />
      </Blob>
    ),
  },
  {
    title: '還沒找到也別急',
    body: '訂閱之後，五天內有新的相符物品，會用 LINE 或 Email 通知你。',
    art: <Blob><BellArt /></Blob>,
  },
  {
    title: '撿到東西？',
    body: '到「拾獲」分頁拍照登記，分類 AI 會幫你填，失主就搜得到。',
    art: (
      <Blob>
        {/* 直式圖（880×1220），用高度控制大小 */}
        <img src={asset('/icons/illustration-found.svg')} alt="" draggable={false}
          className="h-[217px] w-auto select-none land:h-[100px]" />
      </Blob>
    ),
  },
]

const BUTTON_CLASS =
  'box-border flex h-[60px] flex-1 items-center justify-center rounded-[50px] border border-black text-xl font-medium text-brown ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown land:h-12 land:text-base'

export default function OnboardingTour({ onClose }) {
  const trackRef = useRef(null)
  const [current, setCurrent] = useState(0)
  const last = CARDS.length - 1

  // 狀態列色帶跟著米色底
  useStatusBarColor('#f3f0e1')

  // 教學開著時後面的頁面不要跟著捲
  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    return () => { html.style.overflow = prev }
  }, [])

  const go = useCallback((i) => {
    const track = trackRef.current
    if (!track) return
    const next = Math.max(0, Math.min(last, i))
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({ left: next * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' })
    setCurrent(next)
  }, [last])

  // 使用者用手指滑動時，依捲動位置更新目前是第幾張
  const handleScroll = () => {
    const track = trackRef.current
    if (!track) return
    const i = Math.round(track.scrollLeft / track.clientWidth)
    if (i !== current) setCurrent(i)
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="DiuLa! 使用教學"
      className="fixed inset-0 z-[998] flex justify-center">
      <Backdrop className="bg-card" />
      <div className="relative flex h-full w-full max-w-[393px] flex-col pt-[env(safe-area-inset-top)] text-brown land:max-w-[700px]">
        <div className="flex shrink-0 justify-end px-5 pt-[18px] land:pt-2">
          <button type="button" onClick={onClose}
            className="p-2 text-base font-medium text-hint focus-visible:outline-2 focus-visible:outline-brown">
            跳過
          </button>
        </div>

        <div ref={trackRef} onScroll={handleScroll}
          className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CARDS.map((card, i) => (
            <section key={card.title} aria-hidden={i !== current}
              className="flex w-full shrink-0 snap-center flex-col items-center gap-[18px] px-8 pb-4 text-center land:flex-row land:gap-8 land:text-left">
              <div className="flex min-h-0 w-full flex-1 items-center justify-center land:w-auto land:flex-none">
                {card.art}
              </div>
              <div className="flex flex-col items-center gap-[18px] land:items-start land:gap-3">
                <h2 className="text-2xl font-bold leading-[1.3]">{card.title}</h2>
                <p className="max-w-[17em] text-base font-normal leading-normal text-[#6b5440]">{card.body}</p>
              </div>
            </section>
          ))}
        </div>

        <div className="flex shrink-0 justify-center gap-2 pb-1 pt-4 land:pt-1" aria-hidden="true">
          {CARDS.map((card, i) => (
            <span key={card.title}
              className={`h-[9px] rounded-full transition-all duration-200 motion-reduce:transition-none ${i === current ? 'w-6 bg-brown' : 'w-[9px] bg-[#d9d2c2]'}`} />
          ))}
        </div>

        <div className="flex shrink-0 gap-3 px-6 pb-[calc(40px+env(safe-area-inset-bottom))] pt-4 land:pb-[calc(10px+env(safe-area-inset-bottom))] land:pt-2">
          {current > 0 && (
            <button type="button" onClick={() => go(current - 1)} className={`${BUTTON_CLASS} bg-white`}>
              上一步
            </button>
          )}
          <button type="button" onClick={() => (current === last ? onClose() : go(current + 1))}
            className={`${BUTTON_CLASS} bg-blue`}>
            {current === last ? '開始使用' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  )
}
