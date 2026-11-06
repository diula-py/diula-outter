import HomeTabPage from '../components/HomeTabPage'
import { asset } from '../lib/asset'

// 「拾獲」分頁選單資料 —— 之後要改連結或加項目，改這裡就好。
const REGISTER_ITEMS = [
  { icon: asset('/icons/address-card.png'), label: '證件類遺失物登錄', to: '/register/id', needsOnline: true },
  { icon: asset('/icons/clipboard-question.png'), label: '非證件類遺失物登錄', to: '/register/other' },
]

// 掛在底部 TabBar 的「拾獲」分頁（路由 '/found'）。2026-11 從合併版首頁拆出來，
// 跟 HomePage（'/'，尋找分頁）共用 HomeTabPage 骨架。
export default function FoundHomePage() {
  return (
    <HomeTabPage
      title="登錄拾獲物"
      items={REGISTER_ITEMS}
      illustration={{ src: asset('/icons/illustration-found.png') }}
    />
  )
}
