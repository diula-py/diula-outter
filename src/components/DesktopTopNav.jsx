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
// FAQ／關於DiuLa! 這兩個 icon 沒有 PNG 素材，用 Font Awesome（solid）circle-question／circle-info，
// 填 currentColor 跟著 text-brown。
function CircleQuestionIcon(props) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM169.8 165.3c7.9-22.3 29.1-37.3 52.8-37.3l58.3 0c34.9 0 63.1 28.3 63.1 63.1c0 22.6-12.1 43.5-31.7 54.8L280 264.4c-.2 13-10.9 23.6-24 23.6c-13.3 0-24-10.7-24-24l0-13.5c0-8.6 4.6-16.5 12.1-20.8l44.3-25.4c4.7-2.7 7.6-7.7 7.6-13.1c0-8.4-6.8-15.1-15.1-15.1l-58.3 0c-3.4 0-6.4 2.1-7.5 5.3l-.4 1.2c-4.4 12.5-18.2 19-30.6 14.6s-19-18.2-14.6-30.6l.4-1.2zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" />
    </svg>
  )
}
function CircleInfoIcon(props) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
    </svg>
  )
}

// href：外部連結（另開分頁），沒有 activePaths、不會有選中底線。
const NAV_ITEMS = [
  { to: '/', label: '首頁', activePaths: ['/', '/found'], Icon: HouseIcon },
  { to: '/faq', label: 'FAQ', activePaths: ['/faq'], Icon: CircleQuestionIcon },
  { href: 'https://about.diula.co', label: '關於DiuLa!', Icon: CircleInfoIcon },
  { to: '/profile', label: '個人', activePaths: ['/profile'], Icon: UserRegularIcon },
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
            if (item.href) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border-b-2 border-transparent pb-1 text-base font-normal text-brown"
                >
                  <item.Icon className="h-6 w-6 shrink-0" />
                  {item.label}
                </a>
              )
            }
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
        </nav>
      </div>
    </header>
  )
}
