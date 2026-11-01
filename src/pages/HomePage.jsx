import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionTitle from '../components/SectionTitle'
import PillButton from '../components/PillButton'
import AddFriendBanner from '../components/AddFriendBanner'
import { WireDialog, DialogTitle, DialogButton } from '../components/DialogKit'
import { useOnline } from '../lib/useOnline'

// 首頁選單資料 —— 之後要改連結或加項目，改這裡就好。
//   href      → 外部頁面（其他技術做的），整頁跳轉
//   to        → React 內部路由（尚未實作的佔位頁）
//   needsOnline → 離線時按鈕變灰，按下去跳「需要網路」提示（要打 Render 後端的流程）
import { asset } from '../lib/asset'

const FIND_ITEMS = [
  { icon: asset('/icons/search.png'), label: '跨平台尋找遺失物', to: '/search', needsOnline: true },
  { icon: asset('/icons/threads.png'), label: 'Threads尋找遺失物', to: '/search/threads' },
]

const REGISTER_ITEMS = [
  { icon: asset('/icons/address-card.png'), label: '證件類遺失物登錄', to: '/register/id', needsOnline: true },
  { icon: asset('/icons/clipboard-question.png'), label: '非證件類遺失物登錄', to: '/register/other' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const online = useOnline()
  const [offlineNotice, setOfflineNotice] = useState('') // 離線時按到需要網路的功能 → 彈窗顯示功能名稱

  const renderItem = (item) => {
    const blocked = item.needsOnline && !online
    return (
      <PillButton
        key={item.label}
        icon={item.icon}
        label={item.label}
        href={item.href}
        dimmed={blocked}
        onClick={blocked ? () => setOfflineNotice(item.label) : item.to ? () => navigate(item.to) : undefined}
      />
    )
  }

  return (
    <div className="flex flex-col items-center
                    land:grid land:grid-cols-[repeat(2,minmax(0,340px))] land:content-start land:items-start land:justify-center land:gap-x-7">
      {/* 頂部 banner：淺藍、下圓角、109px 高，logo 106×35 在 top:64（比照 inner） */}
      <header className="safe-header flex w-full items-end justify-center rounded-b-[20px] bg-blue pb-[10px] [--header-h:109px]
                         land:col-span-full land:mx-[calc(50%-50vw)] land:w-screen land:[--header-h:76px]">
        <div className="flex h-[35px] w-[106px] items-center justify-center overflow-hidden">
          <img src={asset('/icons/diula-logo.png')} alt="DiuLa!" className="w-full" />
        </div>
      </header>

      {/* LINE 登入但還沒加官方帳號好友才會出現（見 AddFriendBanner） */}
      <AddFriendBanner />

      {/* 內容欄 350 寬（x=21.5；窄螢幕左右各留 20）：標題文字 y=134、第一顆膠囊 y=169、兩顆間距 20、第二區標題 y=414 */}
      <section className="mt-[25px] w-[calc(100%-40px)] max-w-[350px] land:col-start-1 land:mt-[18px] land:w-full land:max-w-none">
        <SectionTitle>尋找遺失物</SectionTitle>
        <div className="mt-[15px] flex flex-col gap-5">{FIND_ITEMS.map(renderItem)}</div>
      </section>

      <section className="mt-[25px] w-[calc(100%-40px)] max-w-[350px] land:col-start-2 land:mt-[18px] land:w-full land:max-w-none">
        <SectionTitle>登錄拾獲物</SectionTitle>
        <div className="mt-[15px] flex flex-col gap-5">{REGISTER_ITEMS.map(renderItem)}</div>
      </section>

      {offlineNotice && (
        <WireDialog height={230} onClose={() => setOfflineNotice('')} label="需要網路">
          <DialogTitle top={62} width={246}>需要網路</DialogTitle>
          <div className="absolute left-1/2 top-[94px] w-[246px] -translate-x-1/2 text-center text-sm font-normal leading-5">
            「{offlineNotice}」需要連上網路，<br />請連線後再使用
          </div>
          <DialogButton left={60} top={146} width={180} tone="blue" onClick={() => setOfflineNotice('')}>確認</DialogButton>
        </WireDialog>
      )}
    </div>
  )
}
