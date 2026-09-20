/**
 * 表單頁共用版型——尺寸逐項對照 inner（index.html 的 page-03/05/10/12），
 * 不是「差不多」：標頭 80px、內容欄 340px、送出鈕 350×60、表單卡片 padding 15／列距 10、
 * 每列高 40、圖示 35 且左側縮 10……改動前請先跟 inner 的數值比對。
 */
import { ChevronLeftIcon, ChevronDownIcon, CircleCheckIcon } from './icons'
import { CITY_ORDER, TAIWAN_REGIONS } from '../data/taiwanRegions'
import { asset } from '../lib/asset'

/** 80px 標頭：標題置中 20/700，返回鍵 30×30 在 (22,25)。onBack 省略＝不顯示返回鍵（如「確認標籤」）。 */
export function FormHeader({ title, onBack }) {
  return (
    <header className="relative z-10 flex h-[80px] w-full shrink-0 items-center justify-center rounded-b-[20px] bg-card pt-[env(safe-area-inset-top)]">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="absolute left-[22px] top-[25px] h-[30px] w-[30px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <ChevronLeftIcon className="h-[30px] w-[30px]" />
        </button>
      )}
      <h1 className="text-xl font-bold text-brown">{title}</h1>
    </header>
  )
}

/** 表單頁外框：置中欄，底部留 80px（inner 的 padding-bottom）。 */
export function FormPage({ children }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col items-center bg-paper pb-[calc(80px+env(safe-area-inset-bottom))]">
      {children}
    </div>
  )
}

/** 200px 高的圖片區（340 寬、灰底黑框、圓角 10）。mt：與上一區塊的間距（inner 各頁不同：20／25／40）。 */
export function UploadBox({ mt = 20, onClick, ariaLabel, src, alt = '', cameraAlt = '上傳照片' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{ marginTop: mt }}
      className="flex h-[200px] w-full max-w-[340px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-black bg-input
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-contain" />
      ) : (
        <img src={asset('/icons/camera.png')} alt={cameraAlt} className="h-10 w-10 object-contain" />
      )}
    </button>
  )
}

/** 米色表單卡片：340 寬、padding 15、列距 10。 */
export function FormCard({ mt = 20, children }) {
  return (
    <div
      style={{ marginTop: mt }}
      className="flex w-full max-w-[340px] shrink-0 flex-col gap-[10px] rounded-[10px] bg-card p-[15px]"
    >
      {children}
    </div>
  )
}

/** 一列：左邊 35×35 圖示（左縮 10）＋右邊 40 高的白色膠囊。icon 傳元素；text 傳字（如「備註」）。 */
export function FormRow({ icon, text, children, pillClass = 'px-[15px]' }) {
  return (
    <div className="flex items-center gap-[10px]">
      {text ? (
        <div className="ml-[10px] flex h-10 w-[35px] shrink-0 items-center justify-center text-base font-normal">{text}</div>
      ) : (
        <div className="ml-[10px] flex h-[35px] w-[35px] shrink-0 items-center justify-center">{icon}</div>
      )}
      <div className={`flex h-10 min-w-0 flex-1 items-center rounded-[50px] border border-black bg-white py-[10px] ${pillClass}`}>
        {children}
      </div>
    </div>
  )
}

/** 膠囊內的輸入框：20 高、12px/400、無框（inner 的 input 樣式）。 */
export const pillInput =
  'h-5 min-h-5 w-full min-w-0 flex-1 bg-transparent p-0 text-xs font-normal leading-5 text-brown outline-none placeholder:text-[#888]'

function SelectBox({ value, onChange, disabled, placeholder, options, className }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-label={placeholder}
      className={`h-5 min-w-0 appearance-none bg-transparent p-0 text-xs font-normal leading-5 text-brown outline-none ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

const chevron = <ChevronDownIcon className="pointer-events-none h-3 w-3 shrink-0" />

/**
 * 地點列。split＝兩個獨立膠囊（page-03/05/10：各 padding 10、select 後接 12px 箭頭）；
 * 否則是單一膠囊內含兩個 select（page-12 證件登錄）。
 */
export function RegionField({ icon, prefix = '', city, setCity, district, setDistrict, split = true }) {
  const cityEl = (cls) => (
    <SelectBox
      value={city}
      onChange={(e) => { setCity(e.target.value); setDistrict('') }}
      placeholder={`${prefix}縣市`}
      options={CITY_ORDER}
      className={cls}
    />
  )
  const distEl = (cls) => (
    <SelectBox
      value={district}
      onChange={(e) => setDistrict(e.target.value)}
      disabled={!city}
      placeholder={`${prefix}地區`}
      options={TAIWAN_REGIONS[city] || []}
      className={cls}
    />
  )

  if (!split) {
    return (
      <FormRow icon={icon} pillClass="gap-[10px] px-[15px]">
        {cityEl('w-1/2')}
        {chevron}
        {distEl('w-1/2')}
        {chevron}
      </FormRow>
    )
  }
  return (
    <div className="flex items-center gap-[10px]">
      <div className="ml-[10px] flex h-[35px] w-[35px] shrink-0 items-center justify-center">{icon}</div>
      {[cityEl, distEl].map((make, i) => (
        <div key={i} className="flex h-10 min-w-0 flex-1 items-center rounded-[50px] border border-black bg-white px-[10px] py-[10px]">
          {make('min-w-0 flex-1')}
          <span className="ml-[6px] flex shrink-0">{chevron}</span>
        </div>
      ))}
    </div>
  )
}

/** 350×60 送出鈕。tone：blue（#DFEAF5，多數頁）／card（#F3F0E1，確認標籤頁）。 */
export function SubmitButton({ onClick, disabled, children, tone = 'blue' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`mb-[20px] mt-[35px] flex h-[60px] w-full max-w-[350px] shrink-0 items-center justify-center gap-[15px] rounded-[50px] border border-black
                  px-[30px] py-[20px] text-base font-medium text-brown transition hover:brightness-[.98] disabled:opacity-60
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                  ${tone === 'card' ? 'bg-card' : 'bg-blue'}`}
    >
      <CircleCheckIcon className="h-10 w-10 shrink-0" />
      <span>{children}</span>
    </button>
  )
}
