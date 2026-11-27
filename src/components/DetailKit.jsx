/**
 * 詳情頁共用版型（inner page-16 我的遺失物詳情／page-19 我的拾獲物詳情）。
 * inner 這兩頁是絕對定位，數值不同（標頭 90／109、資訊卡 175／230、白色欄左緣 109／111），
 * 所以資訊列的位置由呼叫端以 inner 的數值傳入；標頭已統一成 FormHeader 的規格，不再傳數值。
 */
import { ChevronLeftIcon, CircleCheckIcon } from './icons'
import { asset } from '../lib/asset'

/** 標頭規格跟 FormKit 的 FormHeader 一致（2026-11-27 統一全站頁首高度）：
 * 80px（有瀏海時＝狀態列＋73px，見 index.css .safe-header；手機橫放 64px），返回鍵 30×30 垂直置中、left 22。
 * 跟 FormHeader 不同的是標題可能很長（物品名稱、「幫你發Threads的協尋文」），所以保留截斷與窄螢幕縮字。 */
export function DetailHeader({ title, onBack }) {
  return (
    <header className="safe-header relative w-full shrink-0 rounded-b-[20px] bg-card [--header-h:80px]
                       land:col-span-full land:mx-[calc(50%-50vw)] land:w-screen land:[--header-h:64px]
                       md:col-span-full md:mx-[calc(50%-50vw)] md:w-screen">
      <div className="relative flex h-full items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="back-hit absolute left-[22px] top-1/2 h-[30px] w-[30px] -translate-y-1/2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <ChevronLeftIcon className="h-[30px] w-[30px]" />
        </button>
        {/* truncate 會 overflow:hidden，20px 字的字形比 20px 行高略高、頂端會被切，所以上下各多 4px padding。
            字級 20px；螢幕窄於 378px 時隨寬度縮小（320 寬約 17px），長標題才放得下。
            標題整排寬、疊在返回鍵上面，所以設 pointer-events-none，點擊才會落到返回鍵 */}
        <h1 className="pointer-events-none w-full truncate px-[60px] py-1 text-center text-[clamp(17px,5.3vw,20px)] font-bold leading-5 text-brown">
          {title}
        </h1>
      </div>
    </header>
  )
}

/**
 * 340×200 圖片區（灰底、contain、圓角 10）。
 * 沒有照片時照 inner：有文字描述就顯示描述（14/500、行距 150%、padding 20、垂直置中），
 * 否則顯示撐滿整框的 DiuLa Logo（contain）。
 */
export function DetailImage({ src, mt, desc }) {
  return (
    <div
      className="flex h-[200px] w-[calc(100%-40px)] max-w-[340px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-input
                 land:col-start-1 land:mt-0! land:h-[150px] land:w-full land:max-w-none
                 md:col-start-1 md:mt-0! md:w-full md:max-w-none"
      style={{ marginTop: mt }}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-contain" />
      ) : desc ? (
        <div className="box-border flex h-full w-full items-center overflow-y-auto p-5 text-sm font-medium leading-[150%] text-brown">{desc}</div>
      ) : (
        <img src={asset('/icons/logo2.png')} alt="" className="h-full w-full object-contain" />
      )}
    </div>
  )
}

/** 米色資訊卡（340 寬、固定高度），內部列用絕對位置。 */
export function InfoBox({ height, mt = 20, children }) {
  return (
    <div className="relative w-[calc(100%-40px)] max-w-[340px] shrink-0 rounded-[10px] bg-card land:col-start-2 land:row-span-2 land:mt-0! land:w-full land:max-w-none md:col-start-2 md:row-span-2 md:mt-0! md:w-full md:max-w-none" style={{ height, marginTop: mt }}>
      {children}
    </div>
  )
}

/**
 * 一列：icon 在 (iconLeft, iconTop) 35×35；白色 234×40 圓角 10 的欄位在 (pillLeft, pillTop)。座標為相對資訊卡左上角。
 * 欄位寬 = 卡片寬 − 106（340 寬時剛好 234），窄螢幕跟著縮短。
 */
export function InfoRow({ icon, text, iconTop, textTop, pillTop, pillLeft = 82.5, children }) {
  return (
    <>
      {icon && <div className="absolute left-[24.5px] h-[35px] w-[35px]" style={{ top: iconTop }}>{icon}</div>}
      {text && <div className="absolute left-[26.5px] h-4 w-8 text-center text-base font-normal leading-4" style={{ top: textTop }}>{text}</div>}
      <div
        className="absolute box-border flex h-10 w-[calc(100%-106px)] items-center overflow-hidden rounded-[10px] bg-white px-[15px] py-[10px] text-xs font-normal"
        style={{ top: pillTop, left: pillLeft }}
      >
        <span className="w-full truncate">{children}</span>
      </div>
    </>
  )
}

/** 標籤區（AI 產生、使用者增刪、證件類固定、離線手動選的都存在同一個 tags，分不出來源，所以不寫「AI 標籤」）：340 寬、padding 20、標題 16/600（同 inner）、chip 12/400 白底圓角 10、padding 6 14、間距 10。 */
export function TagsBox({ tags, mt = 20 }) {
  return (
    <div className="box-border min-h-[98px] w-[calc(100%-40px)] max-w-[340px] shrink-0 rounded-[10px] bg-card p-5 land:col-start-2 land:mt-0! land:w-full land:max-w-none md:col-start-2 md:mt-0! md:w-full md:max-w-none" style={{ marginTop: mt }}>
      <div className="mb-[10px] text-base font-semibold leading-[18px]">標籤</div>
      <div className="flex flex-wrap gap-[10px]">
        {tags.map((t) => (
          <div key={t} className="rounded-[10px] bg-white px-[14px] py-[6px] text-xs font-normal">{t}</div>
        ))}
      </div>
    </div>
  )
}

/** 350×60 主要動作鈕（padding 30 40、間距 30；寬度不到 380 的螢幕縮成 padding 20、間距 15，文字才排得進一行）；tone：blue（遺失物，#DFEAF5）／card（拾獲物，#F3F0E1）。 */
export function ActionButton({ tone, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-5 box-border flex h-[60px] w-[calc(100%-40px)] max-w-[350px] shrink-0 items-center justify-center gap-[15px] rounded-[50px] border border-black px-5 py-[30px] min-[380px]:gap-[30px] min-[380px]:px-10
                  land:col-span-full land:mt-1 land:justify-self-center
                  md:col-span-full md:justify-self-center
                  text-base font-medium transition hover:brightness-[.98]
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                  ${tone === 'card' ? 'bg-card' : 'bg-blue'}`}
    >
      <CircleCheckIcon className="h-10 w-10 shrink-0" />
      <span>{children}</span>
    </button>
  )
}

/** inner「刪除此筆資料」：100×40、白底 #C4C4C4 框、文字 12/700 #C4C4C4，在主要動作鈕下方 20px。 */
export function DeleteButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-5 box-border flex h-10 w-[100px] shrink-0 items-center justify-center rounded-[50px] border border-[#C4C4C4] bg-white text-xs font-bold leading-3 text-[#C4C4C4]
                 land:col-span-full land:mt-1 land:justify-self-center
                 md:col-span-full md:justify-self-center
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
    >
      刪除此筆資料
    </button>
  )
}
