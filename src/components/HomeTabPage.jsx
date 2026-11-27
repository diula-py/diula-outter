import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionTitle from './SectionTitle'
import PillButton from './PillButton'
import AddFriendBanner from './AddFriendBanner'
import DesktopTopNav from './DesktopTopNav'
import DesktopFooter from './DesktopFooter'
import { ChevronLeftIcon } from './icons'
import { WireDialog, DialogTitle, DialogButton } from './DialogKit'
import { useOnline } from '../lib/useOnline'
import { asset } from '../lib/asset'
import { FIND_ITEMS, REGISTER_ITEMS } from '../lib/homeMenuItems'
import { FIND_HERO, FOUND_HERO } from '../lib/homeHeroes'
import { openTour } from '../lib/tours'
import FloatingStickers from './FloatingStickers'

/**
 * 桌機版 Hero 卡片本體：維持原本桌機版的大尺寸（滿版寬、p-16、rounded-[40px]），
 * 不是把手機版 350×190 的小卡片直接放大——那樣文字/插圖會整組擠在左上角。
 * 插圖跟文案沿用手機版同一份資料（hero.image / hero.desktop），只是排版換成
 * 大尺寸的左文右圖 flex，不是手機版那套絕對定位。
 */
// hero.bg 有半透明色（尋找＝rgba 黃 60%），直接當底色的話後面的漂浮貼紙（FloatingStickers）
// 會透出來。底下先墊一層白色（＝頁面底色，看起來完全一樣），貼紙就會被 Banner 擋住。
const heroBg = (bg) => ({ background: `linear-gradient(${bg}, ${bg}), #fff` })

function DesktopHeroSlide({ hero }) {
  return (
    <section
      className="flex w-full items-center gap-16 rounded-[40px] border border-brown p-16 box-border"
      style={heroBg(hero.bg)}
    >
      <div className="flex max-w-[600px] flex-1 flex-col items-start gap-5">
        <h1 className="m-0 text-[32px] font-bold leading-[38px] tracking-[-0.64px] text-brown">
          {hero.desktop.title.map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </h1>
        {hero.desktop.logo && <img src={hero.desktop.logo} alt="DiuLa!" className="h-7" />}
        <p className="m-0 text-lg leading-[29px] text-brown">{hero.desktop.subtitle}</p>
        <p className="m-0 text-sm leading-relaxed text-brown">{hero.desktop.tagline}</p>
      </div>
      <img
        src={hero.image.src}
        alt=""
        aria-hidden="true"
        className="hidden h-[220px] w-[220px] shrink-0 object-contain sm:block"
      />
    </section>
  )
}

/**
 * 桌機版 Hero 輪播（2026-11 定案：維持原本桌機版 Hero 的大尺寸，但內容改成跟手機版
 * 一樣的插圖主題，左右滑動切換「尋找」「拾獲」兩張）。用原生 scroll-snap 做，
 * 觸控板／觸控螢幕可以直接滑，滑鼠使用者則點左右箭頭或下面的圓點。
 */
function HeroCarousel({ heroes }) {
  const scrollerRef = useRef(null)
  const [active, setActive] = useState(0)

  // 左右箭頭都一直顯示、可以循環：第一張按「上一張」跳到最後一張，最後一張按「下一張」回到第一張
  function goTo(i) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  function handleScroll() {
    const el = scrollerRef.current
    if (!el || !el.clientWidth) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="relative mx-auto w-full max-w-[1280px] px-12 box-border">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {heroes.map((hero, i) => (
          <div key={i} className="w-full shrink-0 snap-center">
            <DesktopHeroSlide hero={hero} />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="上一張"
        onClick={() => goTo((active - 1 + heroes.length) % heroes.length)}
        className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-brown bg-white text-brown shadow-sm transition hover:brightness-[.97]"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="下一張"
        onClick={() => goTo((active + 1) % heroes.length)}
        className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-brown bg-white text-brown shadow-sm transition hover:brightness-[.97]"
      >
        <ChevronLeftIcon className="h-5 w-5 -scale-x-100" />
      </button>

      <div className="mt-4 flex justify-center gap-2">
        {heroes.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`第 ${i + 1} 張`}
            onClick={() => goTo(i)}
            className={`h-2 w-2 rounded-full transition ${active === i ? 'bg-brown' : 'bg-brown/25'}`}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * 底部「拾獲／尋找」兩個分頁共用的骨架。
 * 2026-11：原本合併成一頁的首頁（尋找遺失物＋登錄拾獲物兩個 section）拆成兩個獨立分頁、
 * 底部 TabBar 從 2 分頁（首頁／個人）改成 3 分頁（拾獲／尋找／個人）。兩頁除了標題跟按鈕清單
 * 不一樣，其餘（頂部 banner、AddFriendBanner、離線提示彈窗）完全相同，抽成這支共用——
 * 之後要幫兩頁加插圖卡片之類的裝飾，改這裡一次就蓋到兩頁。
 *
 * props: title（SectionTitle 文字）、items（PillButton 清單，格式同 lib/homeMenuItems 的
 *   FIND_ITEMS/REGISTER_ITEMS）、hero（選填）——頂部插圖卡片：{ bg（底色）,
 *   image: { src, size, right, textRight }（插圖設計稿邊長、離右框距離、左邊文字最寬到哪；
 *   窄螢幕卡片變窄時插圖跟著縮小，不壓到文字；垂直置中）, content（卡片左邊的文字 JSX）}、
 *   tour（這個分頁的使用教學：'find' 或 'found'，標題旁的問號鈕點了會重看，見 lib/tabTours.jsx）。
 *
 * 2026-11 加的桌機版（lg:）：拿到正式 Figma 桌機設計稿後，上面這套手機版插圖
 * hero 在桌機整個換掉，改成「上方導覽列＋淺藍 Hero 文案區＋白色卡片」。一開始桌機版
 * 也維持拆開（這個分頁的卡片只放這個分頁的按鈕），但使用者後來定案：桌機版要把
 * 「尋找遺失物」跟「登錄拾獲物」合併顯示在同一頁——手機版仍維持拆開成拾獲／尋找
 * 兩個分頁（3 分頁 TabBar 不動）。所以桌機區塊改成直接 import FIND_ITEMS／
 * REGISTER_ITEMS 畫兩張卡片，不吃 items/title 以外的 props，/ 和 /found 在桌機
 * 寬度下會渲染出一模一樣的畫面。
 */
export default function HomeTabPage({ title, items, hero, tour }) {
  const navigate = useNavigate()
  const online = useOnline()
  const [offlineNotice, setOfflineNotice] = useState('') // 離線時按到需要網路的功能 → 彈窗顯示功能名稱

  const renderItem = (item, lgBorder = 'black') => {
    const blocked = item.needsOnline && !online
    return (
      <PillButton
        key={item.label}
        icon={item.icon}
        label={item.label}
        href={item.href}
        dimmed={blocked}
        lgBorder={lgBorder}
        tour={item.tour}
        onClick={blocked ? () => setOfflineNotice(item.label) : item.to ? () => navigate(item.to) : undefined}
      />
    )
  }

  return (
    <>
    {/* 背景漂浮貼紙：fixed、z-index -1，在內容後面（見 FloatingStickers 註解） */}
    <FloatingStickers />
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
            className="relative mt-[18px] h-[190px] w-[calc(100%-40px)] max-w-[350px] overflow-hidden rounded-[10px] border border-brown land:hidden md:max-w-[500px]"
            style={heroBg(hero.bg)}
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
        <section className="mt-[25px] w-[calc(100%-40px)] max-w-[350px] land:mt-[18px] land:w-full land:max-w-[700px] md:w-full md:max-w-[700px]">
          <SectionTitle onHelp={tour ? () => openTour(tour) : undefined} helpTour={tour ? `${tour}-help` : undefined}>{title}</SectionTitle>
          <div className="mt-[15px] flex flex-col gap-5 land:grid land:grid-cols-2 land:items-stretch land:gap-4 md:grid md:grid-cols-2 md:items-stretch md:gap-4">
            {items.map(renderItem)}
          </div>
        </section>
      </div>

      {/* ======== 桌機（lg:）：照 2026-11 Figma 桌機設計稿，上方導覽列＋Hero＋雙卡片
          （尋找遺失物／登錄拾獲物合併顯示在同一頁，不管是從 / 還是 /found 進來畫面都一樣） ======== */}
      <div className="hidden lg:flex lg:w-full lg:flex-col lg:items-center">
        <DesktopTopNav />

        {/* 2026-11 定案：桌機版 Hero 維持原本大尺寸，內容改成跟手機版一樣的插圖主題，
            可左右滑動切換「尋找」「拾獲」兩張（見 HeroCarousel）。 */}
        <div className="mt-10 w-full">
          <HeroCarousel heroes={[FIND_HERO, FOUND_HERO]} />
        </div>


        {/* 兩張卡片 560 寬＋64 間距＝1184，跟上面 Hero 同寬，所以在參考寬度 1280 時剛好並排、
            滿版不留空；比這個窄（1024~1279px 左右的桌機寬度）就靠 flex-wrap 自動疊成兩排。 */}
        <div className="mx-auto mt-16 w-full max-w-[1280px] px-12 box-border">
          <div className="flex flex-wrap items-start justify-center gap-16">
            <div id="desktop-find-card" className="flex w-[560px] max-w-full scroll-mt-24 flex-col items-start gap-10 rounded-[48px] border border-black bg-paper p-16 box-border">
              <div className="flex items-center gap-3">
                <img src={asset('/icons/search.png')} alt="" className="h-8 w-8 object-contain" />
                <h2 className="m-0 text-2xl font-normal text-brown">尋找遺失物</h2>
              </div>
              <div className="flex w-full flex-col gap-6">
                {FIND_ITEMS.map((item) => renderItem(item, 'black'))}
              </div>
            </div>

            <div id="desktop-register-card" className="flex w-[560px] max-w-full scroll-mt-24 flex-col items-start gap-10 rounded-[48px] border border-black bg-paper p-16 box-border">
              <div className="flex items-center gap-3">
                <img src={asset('/icons/hand.png')} alt="" className="h-8 w-8 object-contain" />
                <h2 className="m-0 text-2xl font-normal text-brown">登錄拾獲物</h2>
              </div>
              <div className="flex w-full flex-col gap-6">
                {REGISTER_ITEMS.map((item) => renderItem(item, 'brown'))}
              </div>
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
    </>
  )
}
