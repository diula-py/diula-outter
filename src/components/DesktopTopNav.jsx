import { NavLink } from 'react-router-dom'
import { asset } from '../lib/asset'

// 桌機版（≥1024px，lg:）上方導覽列。2026-11 拿到正式 Figma 桌機設計稿後新增；
// 手機版沒有這個元件（桌機才顯示的內容一律用 `hidden lg:flex` 這類 class，
// 不要另外判斷螢幕寬度）。
// 連結直接對應底部 TabBar 現在的三個分頁（拾獲／尋找／個人，見 TabBar.jsx），
// 不是照抄 Figma 原始稿的「首頁／尋找遺失物／Threads尋找遺失物／個人中心」
// 四連結──首頁改分頁後 Threads 已經變成「尋找」頁裡的其中一個按鈕，不是
// 獨立路由，桌機導覽列也跟著只放三個、跟手機版一致。
const NAV_ITEMS = [
  { to: '/found', label: '拾獲' },
  { to: '/', label: '尋找', end: true },
  { to: '/profile', label: '個人' },
]

export default function DesktopTopNav() {
  return (
    <header className="hidden w-full bg-[#F7F4E5] lg:flex lg:justify-center">
      <div className="flex w-full max-w-[1536px] items-center justify-between px-10 py-6">
        <img src={asset('/icons/diula-logo.png')} alt="DiuLa!" className="h-6 opacity-80" />
        <nav className="flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `border-b-2 pb-1 text-base ${isActive ? 'border-brown font-bold' : 'border-transparent font-normal'} text-brown`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
