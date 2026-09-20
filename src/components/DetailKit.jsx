/**
 * 詳情頁共用版型（inner page-16 我的遺失物詳情／page-19 我的拾獲物詳情）。
 * inner 這兩頁是絕對定位，數值不同（標頭 90／109、資訊卡 175／230、白色欄左緣 109／111），
 * 所以標頭與資訊列的位置都由呼叫端以 inner 的數值傳入。
 */
import { ChevronLeftIcon, CircleCheckIcon } from './icons'

export function DetailHeader({ title, onBack, height, titleTop, backLeft, backTop, backSize }) {
  return (
    <header className="relative w-full shrink-0 rounded-b-[20px] bg-card" style={{ height }}>
      <button
        type="button"
        onClick={onBack}
        aria-label="返回"
        className="absolute focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        style={{ left: backLeft, top: backTop, width: backSize, height: backSize }}
      >
        <ChevronLeftIcon style={{ width: backSize, height: backSize }} />
      </button>
      <h1
        className="absolute left-0 w-full truncate px-[60px] text-center text-xl font-bold leading-5 text-brown"
        style={{ top: titleTop }}
      >
        {title}
      </h1>
    </header>
  )
}

/** 340×200 圖片區（灰底、contain、圓角 10）。 */
export function DetailImage({ src, mt, fallback }) {
  return (
    <div
      className="flex h-[200px] w-full max-w-[340px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-input"
      style={{ marginTop: mt }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-contain" /> : fallback}
    </div>
  )
}

/** 米色資訊卡（340 寬、固定高度），內部列用絕對位置。 */
export function InfoBox({ height, mt = 20, children }) {
  return (
    <div className="relative w-full max-w-[340px] shrink-0 rounded-[10px] bg-card" style={{ height, marginTop: mt }}>
      {children}
    </div>
  )
}

/** 一列：icon 在 (iconLeft, iconTop) 35×35；白色 234×40 圓角 10 的欄位在 (pillLeft, pillTop)。座標為相對資訊卡左上角。 */
export function InfoRow({ icon, text, iconTop, textTop, pillTop, pillLeft = 82.5, children }) {
  return (
    <>
      {icon && <div className="absolute left-[24.5px] h-[35px] w-[35px]" style={{ top: iconTop }}>{icon}</div>}
      {text && <div className="absolute left-[26.5px] h-4 w-8 text-center text-base font-normal leading-4" style={{ top: textTop }}>{text}</div>}
      <div
        className="absolute box-border flex h-10 w-[234px] items-center overflow-hidden rounded-[10px] bg-white px-[15px] py-[10px] text-xs font-normal"
        style={{ top: pillTop, left: pillLeft }}
      >
        <span className="w-full truncate">{children}</span>
      </div>
    </>
  )
}

/** AI 標籤區：340 寬、padding 20、標題 16/700、chip 12/400 白底圓角 10、padding 6 14、間距 10。 */
export function TagsBox({ tags, mt = 20 }) {
  return (
    <div className="box-border min-h-[98px] w-full max-w-[340px] shrink-0 rounded-[10px] bg-card p-5" style={{ marginTop: mt }}>
      <div className="mb-[10px] text-base font-bold leading-[18px]">AI 標籤</div>
      <div className="flex flex-wrap gap-[10px]">
        {tags.map((t) => (
          <div key={t} className="rounded-[10px] bg-white px-[14px] py-[6px] text-xs font-normal">{t}</div>
        ))}
      </div>
    </div>
  )
}

/** 350×60 主要動作鈕（padding 30 40、間距 30）；tone：blue（遺失物，#DFEAF5）／card（拾獲物，#F3F0E1）。 */
export function ActionButton({ tone, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-5 box-border flex h-[60px] w-full max-w-[350px] shrink-0 items-center justify-center gap-[30px] rounded-[50px] border border-black px-10 py-[30px]
                  text-base font-medium transition hover:brightness-[.98]
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                  ${tone === 'card' ? 'bg-card' : 'bg-blue'}`}
    >
      <CircleCheckIcon className="h-10 w-10 shrink-0" />
      <span>{children}</span>
    </button>
  )
}
