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
      hero={{
        bg: '#EAE9D5', // 設計稿：綠底
        image: { src: asset('/icons/illustration-found.svg'), size: 170, right: 3.5, textRight: 176.5 }, // 拿證件的小人（動畫：CSS keyframes 寫在 SVG 裡，要用 <img> 載入才會動；直式圖，在正方形框內 object-contain 置中）
        // 直式圖在 170 方框裡實際只佔中間約 123 寬，框左邊約 24px 是透明的，所以 textRight 設到 176.5（350−170−3.5）讓 350 寬卡片能放滿 170，文字也不會被壓到
        content: (
          <>
            <p className="absolute left-[24.5px] top-[26px] w-[170px] text-2xl font-bold leading-[26px]">拾獲物品<br />輕鬆快速登錄</p>
            <p className="absolute left-[24.5px] top-[85px] text-sm font-normal leading-5">做好事，也將收穫好事！</p>
            <p className="absolute left-[24.5px] top-[129px] text-xs font-normal leading-4">證件個資打碼，保護失主隱私<br />登錄物品後送交鄰近機關單位</p>
          </>
        ),
      }}
    />
  )
}
