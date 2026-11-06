import HomeTabPage from '../components/HomeTabPage'
import { asset } from '../lib/asset'

// 「尋找」分頁選單資料 —— 之後要改連結或加項目，改這裡就好。
//   to          → React 內部路由
//   needsOnline → 離線時按鈕變灰，按下去跳「需要網路」提示（要打 Render 後端的流程）
//   primary     → 2026-11 設計討論：這組裡只有「跨平台尋找遺失物」是真正走 AI 比對的主要任務，
//                 其餘是輔助/瀏覽型入口，視覺上要跳出來，不用逐字讀才分得出主次。
const FIND_ITEMS = [
  { icon: asset('/icons/search.png'), label: '跨平台尋找遺失物', to: '/search', needsOnline: true, primary: true },
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
