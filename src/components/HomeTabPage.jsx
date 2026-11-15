import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionTitle from './SectionTitle'
import PillButton from './PillButton'
import AddFriendBanner from './AddFriendBanner'
import DesktopTopNav from './DesktopTopNav'
import DesktopFooter from './DesktopFooter'
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
 *   hero（選填）——頂部插圖卡片：{ bg（底色）, image: { src, size, right, textRight }（插圖設計稿邊長、離右框距離、左邊文字最寬到哪；
 *   窄螢幕卡片變窄時插圖跟著縮小，不壓到文字；垂直置中）, content（卡片左邊的文字 JSX）}。
 *
 * 2026-11 加的桌機版（lg:）：拿到正式 Figma 桌機設計稿後，上面這套手機版插圖
 * hero 在桌機整個換掉，改成「上方導覽列＋淺藍 Hero 文案區＋白色卡片」，跟個人頁
 * （ProfilePage）同一套視覺語言。桌機版只在這個分頁自己的卡片裡放這個分頁的按鈕
 * （不是把尋找／拾獲合併回同一頁——兩個分頁已經拆開，桌機版維持拆開、各自套一樣
 * 的版型，見 diula-inner-rwd 那次討論）。新增 props：
 *   desktopHero: { title, desc } —— 桌機 Hero 文案（手機版插圖 hero 的中文已經很長，
 *     桌機另外寫一版更適合寬螢幕閱讀的）
 *   cardIcon —— 卡片標題旁的圖示（跟其中一顆按鈕共用即可，不用另外設計新圖）
 */
export default function HomeTabPage({ title, items, hero, desktopHero, cardIcon }) {
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
    <div className="flex flex-col items-center lg:block">
      {/* ======== 手機／手機橫放：維持原本版型，桌機（lg:）整個藏起來 ======== */}
      <div className="flex w-full flex-col items-center lg:hidden">
        {/* 頂部 banner（設計稿 Group 17）：淺藍、下圓角 20、100px 高；logo 維持 106×35、離底 10（使用者指定不照設計稿縮小）。
            每頁只有一個 section，不像舊版合併首頁要用 land: 2 欄 grid，header 不用另外 full-bleed。 */}
        <header className="safe-header flex w-full items-end justify-center rounded-b-[20px] bg-blue pb-[10px] [--header-h:100px] land:[--header-h:76px]">
          <div className="flex h-[35px] w-[106px] items-center justify-center overflow-hidden">
            <img src={asset('/icons/diula-logo.png')} alt="DiuLa!" className="w-full" />
          </div>
        </header>

        {/* LINE 登入但還沒加官方帳號好友才會出現（見 AddFriendBanner） */}
        <AddFriendBanner />

        {/* 插圖卡片（設計稿 Rectangle 111）：350×190、1px 咖啡框、圓角 10；底色每頁不同
            （尋找＝黃、拾獲＝綠），左邊放文字（各頁自己傳 hero.content）、右邊放插圖。
            純裝飾，橫式矮螢幕直接藏起來，把高度讓給下面真正有功能的按鈕。 */}
        {hero && (
          <div
            className="relative mt-[18px] h-[190px] w-[calc(100%-40px)] max-w-[350px] overflow-hidden rounded-[10px] border border-brown land:hidden"
            style={{ background: hero.bg }}
          >
            <img
              src={hero.image.src}
              alt=""
              aria-hidden="true"
              className="absolute top-1/2 aspect-square -translate-y-1/2 object-contain"
              style={{ width: `min(${hero.image.size}px, calc(100% - ${hero.image.textRight + hero.image.right}px))`, right: hero.image.right }}
            />
            <div className="relative h-full text-brown">{hero.content}</div>
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
      </div>

      {/* ======== 桌機（lg:）：照 2026-11 Figma 桌機設計稿，上方導覽列＋Hero＋單張卡片 ======== */}
      <div className="hidden lg:flex lg:w-full lg:flex-col lg:items-center">
        <DesktopTopNav />

        {desktopHero && (
          <section className="mx-auto mt-8 flex w-full max-w-[1440px] items-center gap-16 rounded-[40px] border border-brown bg-[#D2E1F5] p-16 box-border">
            <div className="flex max-w-[1054px] flex-col items-start gap-6">
              <h1 className="m-0 text-[32px] font-bold leading-tight text-brown">{desktopHero.title}</h1>
              <p className="m-0 max-w-[512px] text-lg leading-relaxed text-[#566475]">{desktopHero.desc}</p>
            </div>
          </section>
        )}

        <div className="mx-auto mt-16 w-full max-w-[560px] px-12 box-border">
          <div className="flex w-full flex-col items-start gap-10 rounded-[48px] border border-black bg-paper p-16 box-border">
            <div className="flex items-center gap-3">
              {cardIcon && <img src={cardIcon} alt="" className="h-8 w-8 object-contain" />}
              <h2 className="m-0 text-2xl font-normal text-brown">{title}</h2>
            </div>
            <div className="flex w-full flex-col gap-6">
              {items.map(renderItem)}
            </div>
          </div>
        </div>

        <DesktopFooter />
      </div>

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
