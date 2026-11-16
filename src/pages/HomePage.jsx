import HomeTabPage from '../components/HomeTabPage'
import { FIND_ITEMS } from '../lib/homeMenuItems'
import { FIND_HERO } from '../lib/homeHeroes'

// 掛在底部 TabBar 的「尋找」分頁（路由 '/'）。2026-11 從合併版首頁拆出來，
// 「登錄拾獲物」那半移去 FoundHomePage（路由 '/found'）；手機版維持拆開。
// 2026-11 又定案：桌機版（lg:）兩個分頁要合併顯示在同一頁，見 HomeTabPage.jsx
// 的 lg: 區塊——FIND_ITEMS 移到 lib/homeMenuItems.js、hero 插圖移到 lib/homeHeroes.jsx
// 讓那邊也能直接拿來用（桌機版 Hero 改成可左右滑動的輪播，兩頁的插圖卡片都要用到）。
export default function HomePage() {
  return (
    <HomeTabPage
      title="尋找遺失物"
      tour="find"
      items={FIND_ITEMS}
      hero={FIND_HERO}
    />
  )
}
