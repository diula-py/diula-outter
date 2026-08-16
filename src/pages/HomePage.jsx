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
    <div>
      {/* 頂部 banner：淺藍、下圓角，避開 LIFF safe-area */}
      <header className="flex h-[150px] items-end justify-center rounded-b-[20px] bg-blue pb-6 pt-[env(safe-area-inset-top)]">
        <img src={asset('/icons/diula-logo.png')} alt="DiuLa!" className="h-11 w-auto object-contain" />
      </header>

      <div className="flex flex-col gap-8 px-6 pt-6">
        <section className="flex flex-col gap-5">
          <SectionTitle>尋找遺失物</SectionTitle>
          {FIND_ITEMS.map(renderItem)}
        </section>

        <section className="flex flex-col gap-5">
          <SectionTitle>登錄拾獲物</SectionTitle>
          {REGISTER_ITEMS.map(renderItem)}
        </section>
      </div>
    </div>
  )
}
