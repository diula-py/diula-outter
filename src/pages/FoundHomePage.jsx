import HomeTabPage from '../components/HomeTabPage'
import { REGISTER_ITEMS } from '../lib/homeMenuItems'
import { FOUND_HERO } from '../lib/homeHeroes'

// 掛在底部 TabBar 的「拾獲」分頁（路由 '/found'）。2026-11 從合併版首頁拆出來，
// 跟 HomePage（'/'，尋找分頁）共用 HomeTabPage 骨架，手機版維持拆開。
// 2026-11 又定案：桌機版（lg:）兩個分頁要合併顯示在同一頁，見 HomeTabPage.jsx
// 的 lg: 區塊——REGISTER_ITEMS 移到 lib/homeMenuItems.js、hero 插圖移到 lib/homeHeroes.jsx
// 讓那邊也能直接拿來用（桌機版 Hero 改成可左右滑動的輪播，兩頁的插圖卡片都要用到）。
export default function FoundHomePage() {
  return (
    <HomeTabPage
      title="登錄拾獲物"
      tour="found"
      items={REGISTER_ITEMS}
      hero={FOUND_HERO}
    />
  )
}
