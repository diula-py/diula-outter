import { NavLink, useLocation } from 'react-router-dom'
import { asset } from '../lib/asset'

// 桌機版（≥1024px，lg:）上方導覽列。2026-11 拿到正式 Figma 桌機設計稿後新增；
// 手機版沒有這個元件（桌機才顯示的內容一律用 `hidden lg:flex` 這類 class，
// 不要另外判斷螢幕寬度）。
// 手機版底部 TabBar 是拾獲／尋找／個人三個分頁，但桌機版定案要把「尋找遺失物」
// 跟「登錄拾獲物」合併顯示在同一頁（見 HomeTabPage.jsx），/ 和 /found 在桌機
// 寬度下畫面一模一樣，所以這裡只留「首頁」「個人」兩個連結，不跟著手機版拆成三個──
// 「首頁」在 / 或 /found 都要顯示 active，用 activePaths 自己判斷，不吃 NavLink 預設的
// isActive（那個只認得完全符合 to 的那條路徑）。
const NAV_ITEMS = [
  { to: '/', label: '首頁', activePaths: ['/', '/found'] },
  { to: '/profile', label: '個人', activePaths: ['/profile'] },
]

export default function DesktopTopNav() {
  const location = useLocation()

  return (
    <header className="hidden w-full bg-[#F7F4E5] lg:flex lg:justify-center">
      <div className="flex w-full max-w-[1536px] items-center justify-between px-10 py-6">
        <img src={asset('/icons/diula-logo.png')} alt="DiuLa!" className="h-6 opacity-80" />
        <nav className="flex items-center gap-8">
          {NAV_ITEMS.map((item) => {
            const isActive = item.activePaths.includes(location.pathname)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`border-b-2 pb-1 text-base ${isActive ? 'border-brown font-bold' : 'border-transparent font-normal'} text-brown`}
              >
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
