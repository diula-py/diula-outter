import { NavLink } from 'react-router-dom'

import { asset } from '../lib/asset'

// 2026-11：從「首頁／個人」2 分頁改成「拾獲／尋找／個人」3 分頁（設計稿對應圖示：
// hand／magnifying-glass／user）。「尋找」維持掛在 '/'——原本合併版首頁裡「尋找遺失物」
// 排在最前面，當作 app 預設落地頁；「拾獲」另開 '/found'。
// ⚠ 素材庫目前沒有 hand-solid 這張 PNG，暫用 clipboard-question.png 代打占位，
// 等設計稿匯出對應圖檔後把這行 icon 換掉即可，其餘不用動。
const TABS = [
  { to: '/found', icon: asset('/icons/clipboard-question.png'), label: '拾獲' },
  { to: '/', icon: asset('/icons/search.png'), label: '尋找', end: true },
  { to: '/profile', icon: asset('/icons/user.png'), label: '個人' },
]

/**
 * 底部導覽列：340×65 淺藍膠囊，選中態白底圓角 42。
 * 窄螢幕：外框左右各留 20；每個項目用 flex-1 平分寬度（原本 2 分頁時是寫死各佔 50%-14，
 * 3 分頁改用 flex-1 讓它自動三等分，不用重算每個斷點的 px）。
 */
export default function TabBar() {
  return (
    <nav aria-label="主導覽" className="flex h-[65px] w-[calc(100vw-40px)] max-w-[340px] justify-between gap-1 rounded-[50px] bg-blue px-[11px] pt-[10px] land:h-[52px] land:pt-[6px]">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          aria-label={tab.label}
          className={({ isActive }) =>
            `flex h-[46px] max-w-[145px] flex-1 items-center justify-center rounded-[42px] transition-colors duration-300 land:h-10 ${
              isActive ? 'bg-paper' : ''
            }`
          }
        >
          <img src={tab.icon} alt="" aria-hidden="true" className="h-[35px] w-[35px] object-contain land:h-7 land:w-7" />
        </NavLink>
      ))}
    </nav>
  )
}
