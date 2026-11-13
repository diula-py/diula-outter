import { useEffect, useLayoutEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

import { asset } from '../lib/asset'
import { createSlidingTabbar } from '../lib/slidingTabbar'

// 2026-11：從「首頁／個人」2 分頁改成「拾獲／尋找／個人」3 分頁。「尋找」維持掛在
// '/'（app 預設落地頁），「拾獲」另開 '/found'。
// 2026-11-06 使用者定案：由左到右「手＝拾獲、放大鏡＝尋找、人像＝個人」。
const TABS = [
  { to: '/found', icon: asset('/icons/hand.png'), label: '拾獲' },
  { to: '/', icon: asset('/icons/search.png'), label: '尋找', end: true },
  { to: '/profile', icon: asset('/icons/user.png'), label: '個人' },
]

function tabIndexOf(pathname) {
  return TABS.findIndex((t) => (t.end ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + '/')))
}

/**
 * 底部導覽列（設計稿 Frame 6）：340×65 淺藍膠囊，左右內距 16、三個項目平分寬度
 * （icon 落在 x≈50／152.5／255，對齊設計稿 50／152／255）；
 * 選中態是置中的 90×46 白底、圓角 40（窄螢幕分到的寬度不夠 90 時跟著縮）。
 *
 * 2026-11 PM 範例：白底改成一顆獨立的膠囊，切分頁時用彈簧動畫滑過去；
 * 長按膠囊 0.28 秒可以拿起來拖到別的分頁（經過的圖示放大、手機輕震）。
 * 動畫邏輯在 lib/slidingTabbar.js。
 */
export default function TabBar() {
  const navRef = useRef(null)
  const pillRef = useRef(null)
  const itemRefs = useRef([])
  const ctrlRef = useRef(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const index = tabIndexOf(pathname)

  // 拖曳放開 → 切到那一頁。用 ref 讓動畫引擎永遠拿到最新的 navigate
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  useLayoutEffect(() => {
    // 第一次掛上時直接停在目前分頁（不滑），之後的變化交給下面的 setIndex
    const ctrl = createSlidingTabbar(navRef.current, pillRef.current, itemRefs.current, index, {
      onSelect: (i) => navigateRef.current(TABS[i].to),
    })
    ctrlRef.current = ctrl
    return () => { ctrl.destroy(); ctrlRef.current = null }
  }, [])

  // 路由變了（點按分頁、上一頁、程式導頁）→ 膠囊滑過去
  useEffect(() => {
    ctrlRef.current?.setIndex(index)
  }, [index])

  return (
    <nav
      ref={navRef}
      aria-label="主導覽"
      className="relative flex h-[65px] w-[calc(100vw-40px)] max-w-[340px] touch-none select-none justify-between rounded-[50px] bg-blue px-4 pt-[10px] [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] data-[dragging]:cursor-grabbing land:h-[52px] land:pt-[6px]"
    >
      <span
        ref={pillRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-[10px] h-[46px] w-[min(90px,calc((100%-32px)/3))] rounded-[40px] bg-paper shadow-[0_0_0_rgba(73,44,19,0)] transition-shadow duration-[250ms] will-change-transform data-[lifted]:shadow-[0_8px_20px_rgba(73,44,19,.16),0_2px_6px_rgba(73,44,19,.10)] land:top-[6px] land:h-10"
      />
      {TABS.map((tab, i) => (
        <NavLink
          key={tab.to}
          ref={(el) => { itemRefs.current[i] = el }}
          to={tab.to}
          end={tab.end}
          aria-label={tab.label}
          draggable={false}
          className="group relative flex h-[46px] flex-1 items-center justify-center [-webkit-tap-highlight-color:transparent] [[data-dragging]_&]:cursor-grabbing land:h-10"
        >
          <img
            src={tab.icon}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="h-[35px] w-[35px] object-contain transition-transform duration-[280ms] ease-[cubic-bezier(.34,1.56,.64,1)] group-data-[hover]:scale-[1.14] land:h-7 land:w-7"
          />
        </NavLink>
      ))}
    </nav>
  )
}
