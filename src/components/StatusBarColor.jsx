import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 狀態列（時間・電量那條）底色跟著目前頁面頂端的顏色走，不再多一條白色色塊。
 * - iOS 主畫面 App：index.html 設了 black-translucent，網頁會畫到狀態列底下，
 *   #root 已往下推 safe-area（見 index.css --top-inset），這裡補一條固定在頂端的同色色帶。
 * - Safari／Android：另外同步 <meta name="theme-color">。
 * 沒列到的頁面 header 都是米色卡片（bg-card）。
 *
 * 另外：iOS 主畫面 App（black-translucent）的 100dvh 比螢幕少一個狀態列高度，
 * 頁面底部會露出一段 html 底色。整頁是色底的頁面（登入、AI 分析中）把 html 底色設成同色，
 * 其他頁面維持白色（同 bg-paper）。
 */
const COLOR_BY_PATH = {
  '/': '#dfeaf5', // 首頁 banner（bg-blue）
  '/profile': '#dfeaf5',
  '/login': '#dfeaf5',
  '/search/analyzing': '#CDDCF0', // AnalyzingScreen 底色
  '/register/analyzing': '#CDDCF0',
  '/register/success': '#ffffff', // 沒有 header，頂端是白底
  '/about': '#ffffff',
}
const DEFAULT_COLOR = '#f3f0e1'

const PAGE_BG_BY_PATH = {
  '/login': '#dfeaf5', // LoginPage bg-blue
  '/search/analyzing': '#CDDCF0',
  '/register/analyzing': '#CDDCF0',
}
const DEFAULT_PAGE_BG = '#ffffff'

export default function StatusBarColor() {
  const { pathname } = useLocation()
  const color = COLOR_BY_PATH[pathname] ?? DEFAULT_COLOR
  const pageBg = PAGE_BG_BY_PATH[pathname] ?? DEFAULT_PAGE_BG

  useEffect(() => {
    document.documentElement.style.backgroundColor = pageBg
  }, [pageBg])

  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = color
  }, [color])

  // z-40：蓋過捲上來的頁面內容；離線提示條（z-50）與各種對話框會蓋在它上面
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top)]"
      style={{ background: color }}
    />
  )
}
