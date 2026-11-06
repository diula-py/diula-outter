import HomeTabPage from '../components/HomeTabPage'
import { asset } from '../lib/asset'

// 「尋找」分頁選單資料 —— 之後要改連結或加項目，改這裡就好。
//   to          → React 內部路由
//   needsOnline → 離線時按鈕變灰，按下去跳「需要網路」提示（要打 Render 後端的流程）
// ⚠「近2日遺失物快速看」目前導去 /profile，但那邊原本顯示這份資料的卡片
// （RecentLostQuickView，打 /subscriptions/recent-matches）2026-11 已經被拿掉
// （使用者說個人頁不需要那張卡片），這顆按鈕現在等於導去一個沒有對應內容的頁面。
// 還沒決定這個功能最後要放哪（獨立頁面／別的地方），先別自己接掉，等使用者決定。
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
      hero={{
        bg: 'rgba(252, 230, 183, 0.6)', // 設計稿：黃底
        image: { src: asset('/icons/illustration-search.png'), size: 145, right: 11.5, textRight: 192 }, // 放大鏡插圖
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
