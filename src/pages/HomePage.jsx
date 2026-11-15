import HomeTabPage from '../components/HomeTabPage'
import { FIND_ITEMS } from '../lib/homeMenuItems'
import { asset } from '../lib/asset'

// 掛在底部 TabBar 的「尋找」分頁（路由 '/'）。2026-11 從合併版首頁拆出來，
// 「登錄拾獲物」那半移去 FoundHomePage（路由 '/found'）；手機版維持拆開。
// 2026-11 又定案：桌機版（lg:）兩個分頁要合併顯示在同一頁，見 HomeTabPage.jsx
// 的 lg: 區塊——FIND_ITEMS 移到 lib/homeMenuItems.js 讓那邊也能直接拿來用。
export default function HomePage() {
  return (
    <HomeTabPage
      title="尋找遺失物"
      items={FIND_ITEMS}
      hero={{
        bg: 'rgba(252, 230, 183, 0.6)', // 設計稿：黃底
        image: { src: asset('/icons/illustration-search.svg'), size: 145, right: 11.5, textRight: 192 }, // 放大鏡插圖（動畫：CSS keyframes 寫在 SVG 裡，要用 <img> 載入才會動）
        content: (
          <>
            <p className="absolute left-[24.5px] top-[26px] w-[156px] text-2xl font-bold leading-[26px]">東西不見了<br />別擔心</p>
            <img src={asset('/icons/diula-logo-cropped.png')} alt="DiuLa!" className="absolute left-[24.5px] top-[97px] h-5" />
            <p className="absolute left-[24.5px] top-[124px] text-sm font-normal leading-5">是你與失物重逢的捷徑</p>
            <p className="absolute left-[24.5px] top-[143px] text-xs font-normal leading-5">省時省力｜自動尋找｜擴大協尋</p>
          </>
        ),
      }}
    />
  )
}
