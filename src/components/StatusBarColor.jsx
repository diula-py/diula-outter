import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * iOS 主畫面 PWA 的狀態列（時間・電量那條）預設是白底，跟 header 之間會多一條白色色塊。
 * 用 <meta name="theme-color"> 讓狀態列底色跟著目前頁面頂端的顏色走。
 * 沒列到的頁面 header 都是米色卡片（bg-card）。
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

export default function StatusBarColor() {
  const { pathname } = useLocation()

  useEffect(() => {
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = COLOR_BY_PATH[pathname] ?? DEFAULT_COLOR
  }, [pathname])

  return null
}
