import HomeTabPage from '../components/HomeTabPage'
import { asset } from '../lib/asset'

// 「尋找」分頁選單資料 —— 之後要改連結或加項目，改這裡就好。
//   to          → React 內部路由
//   needsOnline → 離線時按鈕變灰，按下去跳「需要網路」提示（要打 Render 後端的流程）
// 「近2日遺失物快速看」原始設計稿配在這裡（第二顆），但那個功能實際上長在個人頁
// 的 RecentLostQuickView（見 ProfilePage.jsx，打 /subscriptions/recent-matches）。
// 這裡先導去 /profile，不是精準跳到那張卡片——要做到精準需要在個人頁加錨點捲動，
// 或把那段抽成獨立頁面，這兩種都是更大的改動，先不要自作主張動，等使用者決定要哪種。
const FIND_ITEMS = [
  { icon: asset('/icons/search.png'), label: '跨平台尋找遺失物', to: '/search', needsOnline: true },
  { icon: asset('/icons/clock-rotate-left.png'), label: '近2日遺失物快速看', to: '/profile', needsOnline: true },
  { icon: asset('/icons/threads.png'), label: 'Threads尋找遺失物', to: '/search/threads' },
]

// 掛在底部 TabBar 的「尋找」分頁（路由 '/'）。2026-11 從合併版首頁拆出來，
// 「登錄拾獲物」那半移去 FoundHomePage（路由 '/found'）。
export default function HomePage() {
  return (
    <HomeTabPage
      title="尋找遺失物"
      items={FIND_ITEMS}
      illustration={{ src: asset('/icons/illustration-search.png') }}
    />
  )
}
