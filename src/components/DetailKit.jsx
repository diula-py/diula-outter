/**
 * 詳情頁共用版型（inner page-16 我的遺失物詳情／page-19 我的拾獲物詳情）。
 * inner 這兩頁是絕對定位，數值不同（標頭 90／109、資訊卡 175／230、白色欄左緣 109／111），
 * 所以標頭與資訊列的位置都由呼叫端以 inner 的數值傳入。
 */
import { ChevronLeftIcon, CircleCheckIcon } from './icons'
import { asset } from '../lib/asset'

export function DetailHeader({ title, onBack, height, titleTop, backLeft, backTop, backSize }) {
  // header 延伸到狀態列底下（safe-header-bleed），inner 的數值本來就含狀態列（約 59px）。
  // 整組移到「狀態列下方 5px」：iPhone PWA（狀態列 59）跟原本一樣；
  // LINE App／瀏覽器裡沒有狀態列（safe-area＝0），不留狀態列的空白，返回鍵改離頂端 25px。
  const shift = `calc(max(env(safe-area-inset-top, 0px), 20px) + ${5 - Math.min(titleTop, backTop)}px)`
  return (
    <header className="safe-header-bleed relative w-full shrink-0 rounded-b-[20px] bg-card" style={{ height: `calc(${height}px + ${shift})` }}>
      <button
        type="button"
        onClick={onBack}
        aria-label="返回"
        className="back-hit absolute focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        style={{ left: backLeft, top: `calc(${backTop}px + ${shift})`, width: backSize, height: backSize }}
      >
        <ChevronLeftIcon style={{ width: backSize, height: backSize }} />
      </button>
      {/* truncate 會 overflow:hidden，20px 字的字形比 20px 行高略高、頂端會被切；
          上下各多 4px padding 並把 top 往上移 4px，文字位置不變但不再被切。
          字級 20px；螢幕窄於 378px 時隨寬度縮小（320 寬約 17px），長標題（如「幫你發Threads的協尋文」）才放得下
          標題整排寬、疊在返回鍵上面，所以設 pointer-events-none，點擊才會落到返回鍵 */}
      <h1
        className="pointer-events-none absolute left-0 w-full truncate px-[60px] py-1 text-center text-[clamp(17px,5.3vw,20px)] font-bold leading-5 text-brown"
        style={{ top: `calc(${titleTop - 4}px + ${shift})` }}
      >
        {title}
      </h1>
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
      className="flex h-[200px] w-[calc(100%-40px)] max-w-[340px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-input"
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
    <div className="relative w-[calc(100%-40px)] max-w-[340px] shrink-0 rounded-[10px] bg-card" style={{ height, marginTop: mt }}>
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

/** AI 標籤區：340 寬、padding 20、標題 16/600（同 inner）、chip 12/400 白底圓角 10、padding 6 14、間距 10。 */
export function TagsBox({ tags, mt = 20 }) {
  return (
    <div className="box-border min-h-[98px] w-[calc(100%-40px)] max-w-[340px] shrink-0 rounded-[10px] bg-card p-5" style={{ marginTop: mt }}>
      <div className="mb-[10px] text-base font-semibold leading-[18px]">AI 標籤</div>
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
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
    >
      刪除此筆資料
    </button>
  )
}
