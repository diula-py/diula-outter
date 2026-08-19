import { ChevronDownIcon } from './icons'
import { CITY_ORDER, TAIWAN_REGIONS } from '../data/taiwanRegions'

// 地點列：左邊一個地點圖示，右邊「縣市 / 地區」兩個下拉左右並排。
// variant：pill = 圓角膠囊+黑框（證件登錄／跨平台）；plain = 圓角白框（確認標籤頁）。
const BOX = {
  pill: 'rounded-[50px] border border-black',
  plain: 'rounded-[10px]',
}

function Box({ value, onChange, disabled, placeholder, options, variant }) {
  return (
    <div className={`relative flex h-10 min-w-0 flex-1 items-center bg-white px-3 ${BOX[variant]}`}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={placeholder}
        className={`min-w-0 flex-1 appearance-none bg-transparent pr-5 text-xs outline-none disabled:opacity-50
          ${value ? 'text-brown' : 'text-hint'}`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-navy" />
    </div>
  )
}

export default function RegionRow({ left, prefix = '', city, setCity, district, setDistrict, variant = 'pill' }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-[46px] shrink-0 items-center justify-center">{left}</div>
      <div className="flex min-w-0 flex-1 gap-2.5">
        <Box
          variant={variant}
          value={city}
          onChange={(e) => { setCity(e.target.value); setDistrict('') }}
          placeholder={`${prefix}縣市`}
          options={CITY_ORDER}
        />
        <Box
          variant={variant}
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          disabled={!city}
          placeholder={`${prefix}地區`}
          options={TAIWAN_REGIONS[city] || []}
        />
      </div>
    </div>
  )
}
