import { useNavigate } from 'react-router-dom'
import SectionTitle from '../components/SectionTitle'
import PillButton from '../components/PillButton'

// 首頁選單資料 —— 之後要改連結或加項目，改這裡就好。
//   href      → 外部頁面（其他技術做的），整頁跳轉
//   to        → React 內部路由（尚未實作的佔位頁）
import { asset } from '../lib/asset'

const FIND_ITEMS = [
  { icon: asset('/icons/search.png'), label: '跨平台尋找遺失物', to: '/search' },
  { icon: asset('/icons/threads.png'), label: 'Threads尋找遺失物', to: '/search/threads' },
]

const REGISTER_ITEMS = [
  { icon: asset('/icons/address-card.png'), label: '證件類遺失物登錄', to: '/register/id' },
  { icon: asset('/icons/clipboard-question.png'), label: '非證件類遺失物登錄', to: '/register/other' },
]

export default function HomePage() {
  const navigate = useNavigate()

  const renderItem = (item) => (
    <PillButton
      key={item.label}
      icon={item.icon}
      label={item.label}
      href={item.href}
      onClick={item.to ? () => navigate(item.to) : undefined}
    />
  )

  return (
    <div className="flex flex-col items-center">
      {/* 頂部 banner：淺藍、下圓角、109px 高，logo 106×35 在 top:64（比照 inner） */}
      <header className="flex h-[109px] w-full items-end justify-center rounded-b-[20px] bg-blue pb-[10px] pt-[env(safe-area-inset-top)]">
        <div className="flex h-[35px] w-[106px] items-center justify-center overflow-hidden">
          <img src={asset('/icons/diula-logo.png')} alt="DiuLa!" className="w-full" />
        </div>
      </header>

      {/* 內容欄 350 寬（x=21.5）：標題文字 y=134、第一顆膠囊 y=169、兩顆間距 20、第二區標題 y=414 */}
      <section className="mt-[25px] w-[350px]">
        <SectionTitle>尋找遺失物</SectionTitle>
        <div className="mt-[15px] flex flex-col gap-5">{FIND_ITEMS.map(renderItem)}</div>
      </section>

      <section className="mt-[25px] w-[350px]">
        <SectionTitle>登錄拾獲物</SectionTitle>
        <div className="mt-[15px] flex flex-col gap-5">{REGISTER_ITEMS.map(renderItem)}</div>
      </section>
    </div>
  )
}
