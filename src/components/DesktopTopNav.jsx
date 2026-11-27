import { Link, NavLink, useLocation } from 'react-router-dom'
import { asset } from '../lib/asset'
import { HouseIcon, UserRegularIcon } from './icons'

// 桌機版（≥1024px，lg:）上方導覽列。2026-11 拿到正式 Figma 桌機設計稿後新增；
// 手機版沒有這個元件（桌機才顯示的內容一律用 `hidden lg:flex` 這類 class，
// 不要另外判斷螢幕寬度）。
// 手機版底部 TabBar 是拾獲／尋找／個人三個分頁，但桌機版定案要把「尋找遺失物」
// 跟「登錄拾獲物」合併顯示在同一頁（見 HomeTabPage.jsx），/ 和 /found 在桌機
// 寬度下畫面一模一樣，所以這裡只留「首頁」「個人」兩個連結，不跟著手機版拆成三個──
// 「首頁」在 / 或 /found 都要顯示 active，用 activePaths 自己判斷，不吃 NavLink 預設的
// isActive（那個只認得完全符合 to 的那條路徑）。
// icon 跟手機版底部 TabBar 同一套素材：個人就是同一張 user.png；首頁沒有對應的
// 單一分頁（合併了手機版的拾獲／尋找兩個 tab），用現成的 house.png 代表進站。
const NAV_ITEMS = [
  { to: '/', label: '首頁', activePaths: ['/', '/found'], Icon: HouseIcon },
  { to: '/profile', label: '個人', activePaths: ['/profile'], Icon: UserRegularIcon },
]

// 主選單後面的次要連結：小字、不用 icon，樣式同頁尾（DesktopFooter）那排連結。
// href＝外部連結（另開分頁）；在 /faq 時 FAQ 不淡化，表示目前所在頁。
const SUB_LINKS = [
  { to: '/faq', label: 'FAQ' },
  { href: 'https://about.diula.co', label: '關於DiuLa!' },
]

export default function DesktopTopNav() {
  const location = useLocation()

  return (
    <header className="hidden h-[78px] w-full bg-blue lg:flex lg:justify-center">
      <div className="flex w-full max-w-[1536px] items-center justify-between px-10">
        {/* diula-logo.png 是正方形畫布、文字只佔中間一小條，直接設高度幾乎看不到字——
            改用裁過的 diula-logo-cropped.png（跟 HomePage hero 插圖同一張），高度才吃得到。
            點 logo 回首頁是一般網站慣例，手機版沒有對應元件所以不用管那邊。 */}
        <Link to="/" aria-label="回首頁">
          <img src={asset('/icons/diula-logo-cropped.png')} alt="DiuLa!" className="h-12" />
        </Link>
        <nav className="flex items-center gap-8">
          {NAV_ITEMS.map((item) => {
            const isActive = item.activePaths.includes(location.pathname)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 border-b-2 pb-1 text-base ${isActive ? 'border-brown font-bold' : 'border-transparent font-normal'} text-brown`}
              >
                <item.Icon className="h-6 w-6 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
          {SUB_LINKS.map((item) =>
            item.href ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="pb-[6px] text-sm font-medium text-brown opacity-80 hover:opacity-100"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={`pb-[6px] text-sm font-medium text-brown hover:opacity-100 ${location.pathname === item.to ? 'opacity-100' : 'opacity-80'}`}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  )
}
