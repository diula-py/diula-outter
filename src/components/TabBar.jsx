import { NavLink } from 'react-router-dom'

import { asset } from '../lib/asset'

// 2026-11：從「首頁／個人」2 分頁改成「拾獲／尋找／個人」3 分頁。「尋找」維持掛在
// '/'（app 預設落地頁），「拾獲」另開 '/found'。
// 2026-11-06 使用者定案：由左到右「手＝拾獲、放大鏡＝尋找、人像＝個人」。
const TABS = [
  { to: '/found', icon: asset('/icons/hand.png'), label: '拾獲' },
  { to: '/', icon: asset('/icons/search.png'), label: '尋找', end: true },
  { to: '/profile', icon: asset('/icons/user.png'), label: '個人' },
]

/**
 * 底部導覽列（設計稿 Frame 6）：340×65 淺藍膠囊，左右內距 16、三個項目平分寬度
 * （icon 落在 x≈50／152.5／255，對齊設計稿 50／152／255）；
 * 選中態是置中的 90×46 白底、圓角 40（窄螢幕分到的寬度不夠 90 時跟著縮）。
 */
export default function TabBar() {
  return (
    <nav aria-label="主導覽" className="flex h-[65px] w-[calc(100vw-40px)] max-w-[340px] justify-between rounded-[50px] bg-blue px-4 pt-[10px] land:h-[52px] land:pt-[6px]">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          aria-label={tab.label}
          className="flex h-[46px] flex-1 justify-center land:h-10"
        >
          {({ isActive }) => (
            <span
              className={`flex h-full w-full max-w-[90px] items-center justify-center rounded-[40px] transition-colors duration-300 ${
                isActive ? 'bg-paper' : ''
              }`}
            >
              <img src={tab.icon} alt="" aria-hidden="true" className="h-[35px] w-[35px] object-contain land:h-7 land:w-7" />
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
