import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionTitle from './SectionTitle'
import PillButton from './PillButton'
import AddFriendBanner from './AddFriendBanner'
import { WireDialog, DialogTitle, DialogButton } from './DialogKit'
import { useOnline } from '../lib/useOnline'
import { asset } from '../lib/asset'

/**
 * 底部「拾獲／尋找」兩個分頁共用的骨架。
 * 2026-11：原本合併成一頁的首頁（尋找遺失物＋登錄拾獲物兩個 section）拆成兩個獨立分頁、
 * 底部 TabBar 從 2 分頁（首頁／個人）改成 3 分頁（拾獲／尋找／個人）。兩頁除了標題跟按鈕清單
 * 不一樣，其餘（頂部 banner、AddFriendBanner、離線提示彈窗）完全相同，抽成這支共用——
 * 之後要幫兩頁加插圖卡片之類的裝飾，改這裡一次就蓋到兩頁。
 *
 * props: title（SectionTitle 文字）、items（PillButton 清單，格式同舊版 FIND_ITEMS/REGISTER_ITEMS）、
 *   illustration（選填，{ src, alt } ）——拾獲頁的插圖還沒拿到，沒給就不渲染卡片，不會留空殼。
 */
export default function HomeTabPage({ title, items, illustration }) {
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
    <div className="flex flex-col items-center">
      {/* 頂部 banner：淺藍、下圓角、109px 高，logo 106×35（比照 inner）。
          每頁只有一個 section，不像舊版合併首頁要用 land: 2 欄 grid，header 不用另外 full-bleed。 */}
      <header className="safe-header flex w-full items-end justify-center rounded-b-[20px] bg-blue pb-[10px] [--header-h:109px] land:[--header-h:76px]">
        <div className="flex h-[35px] w-[106px] items-center justify-center overflow-hidden">
          <img src={asset('/icons/diula-logo.png')} alt="DiuLa!" className="w-full" />
        </div>
      </header>

      {/* LINE 登入但還沒加官方帳號好友才會出現（見 AddFriendBanner） */}
      <AddFriendBanner />

      {/* 插圖卡片：2026-11 設計討論時提過舊稿插圖偏一邊、卡片一半是死空間，兩頁底色又不一致，
          這裡改成置中構圖、底色統一用跟按鈕同一組 card 米色（不另外混新顏色）。純裝飾，
          橫式矮螢幕直接藏起來，把高度讓給下面真正有功能的按鈕（land: 本來就是為了這個）。 */}
      {illustration && (
        <div className="mt-[18px] flex w-[calc(100%-40px)] max-w-[350px] items-center justify-center rounded-[10px] border border-brown bg-card py-7 land:hidden">
          <img src={illustration.src} alt={illustration.alt || ''} aria-hidden={illustration.alt ? undefined : 'true'} className="h-[140px] w-[140px] object-contain" />
        </div>
      )}

      {/* 內容欄 350 寬（窄螢幕左右各留 20）。橫式矮螢幕把按鈕排成兩欄，不然只有兩顆按鈕
          堆疊起來也要捲動，違背 land: 本來要解決的問題。 */}
      <section className="mt-[25px] w-[calc(100%-40px)] max-w-[350px] land:mt-[18px] land:w-full land:max-w-[700px]">
        <SectionTitle>{title}</SectionTitle>
        <div className="mt-[15px] flex flex-col gap-5 land:grid land:grid-cols-2 land:items-stretch land:gap-4">
          {items.map(renderItem)}
        </div>
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
