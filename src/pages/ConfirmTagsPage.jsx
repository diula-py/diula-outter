import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDownIcon,
  CalendarIcon,
  LocationIcon,
  CircleCheckIcon,
  PlusIcon,
} from '../components/icons'
import { CITY_ORDER, TAIWAN_REGIONS } from '../data/taiwanRegions'
import TagPickerModal from '../components/TagPickerModal'
import { flask } from '../lib/api'

function TagXIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="2.5" strokeLinecap="round" {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

function Field({ left, children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-[46px] shrink-0 items-center justify-center">{left}</div>
      <div className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-[10px] bg-white px-4">
        {children}
        <ChevronDownIcon className="h-[18px] w-[18px] shrink-0 text-navy" />
      </div>
    </div>
  )
}

const inputClass = 'min-w-0 flex-1 bg-transparent text-xs text-brown outline-none placeholder:text-hint'

// 地點下拉：select 佔滿整格、箭頭疊右側 pointer-events-none，連箭頭都能點開原生下拉。
function SelectField({ left, value, onChange, disabled, placeholder, children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-[46px] shrink-0 items-center justify-center">{left}</div>
      <div className="relative flex h-10 min-w-0 flex-1 items-center rounded-[10px] bg-white px-4">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-label={placeholder}
          className={`min-w-0 flex-1 appearance-none bg-transparent pr-6 text-xs outline-none disabled:opacity-50
            ${value ? 'text-brown' : 'text-hint'}`}
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-navy" />
      </div>
    </div>
  )
}

export default function ConfirmTagsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const data = location.state || {}

  const [date, setDate] = useState(data.date || '2026-05-07')
  const [placeCity, setPlaceCity] = useState((data.place || '').split(' ')[0] || '')
  const [placeDistrict, setPlaceDistrict] = useState((data.place || '').split(' ')[1] || '')
  const [remark, setRemark] = useState(data.remark || '')
  const [tags, setTags] = useState(data.tags || ['杯套', '水杯'])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const place = [placeCity, placeDistrict].filter(Boolean).join(' ') // 遺失地點合併字串

  function removeTag(t) {
    setTags((prev) => prev.filter((x) => x !== t))
  }

  async function handleConfirm() {
    setError('')
    if (tags.length === 0) { setError('至少要有一個標籤才能比對'); return }
    setBusy(true)
    try {
      const res = await fetch(flask('/match'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lost_date: date,       // YYYY-MM-DD
          tags,                  // 後端用標籤正規化出分類與顏色
          detail: place,         // 詳細地點
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `伺服器回應 ${res.status}`)
      navigate('/search/results', { state: { query: { date, place, tags }, base64Image: data.base64Image, ...json } })
    } catch (e) {
      setError(`比對失敗：${e.message}（請確認 Flask :5001 有啟動）`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-base pb-10">
      {/* Header（cream，80px，僅標題） */}
      <header className="flex h-20 items-center justify-center rounded-b-[20px] bg-card pt-[env(safe-area-inset-top)]">
        <h1 className="text-xl font-bold text-brown">{data.name || '確認標籤'}</h1>
      </header>

      <div className="flex flex-col gap-5 px-[26px] pt-5">
        {/* 圖片 */}
        <div className="flex h-[200px] w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#e7e3d5]">
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-14 w-14 text-brown/30" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.1 2 5 5.1 5 9c0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
            </svg>
          )}
        </div>

        {/* 日期 / 地點 / 備註 */}
        <div className="flex flex-col gap-[15px] rounded-[10px] bg-card px-4 py-5">
          <Field left={<CalendarIcon className="h-[30px] w-[30px] text-navy" />}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="遺失日期"
              className={`${inputClass} [&::-webkit-calendar-picker-indicator]:hidden`} />
          </Field>
          <SelectField
            left={<LocationIcon className="h-[30px] w-[26px] text-navy" />}
            value={placeCity}
            onChange={(e) => { setPlaceCity(e.target.value); setPlaceDistrict('') }}
            placeholder="遺失的地點（縣市）"
          >
            {CITY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <SelectField
            left={<LocationIcon className="h-[30px] w-[26px] text-navy" />}
            value={placeDistrict}
            onChange={(e) => setPlaceDistrict(e.target.value)}
            disabled={!placeCity}
            placeholder="遺失的地點（地區）"
          >
            {(TAIWAN_REGIONS[placeCity] || []).map((d) => <option key={d} value={d}>{d}</option>)}
          </SelectField>
          <Field left={<span className="text-base text-brown">備註</span>}>
            <input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="--" className={inputClass} />
          </Field>
        </div>

        {/* AI 標籤（可增刪） */}
        <div className="flex flex-col gap-3 rounded-[10px] bg-card p-5">
          <span className="text-base font-semibold text-brown">AI 標籤</span>
          <div className="flex flex-wrap gap-2.5">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-2 rounded-[50px] border border-black bg-blue px-4 py-1.5 text-xs text-brown">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} aria-label={`移除 ${tag}`} className="p-0.5">
                  <TagXIcon className="h-[13px] w-[13px]" />
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-2 rounded-[50px] border border-black bg-white px-4 py-1.5 text-xs text-brown"
            >
              <PlusIcon className="h-3 w-3 text-brown" />
              新增
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        {/* 確認 */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className="mt-1 flex h-[60px] w-full items-center justify-center gap-4 rounded-[50px] border border-black bg-card
                     text-base font-medium text-brown transition hover:bg-[#eee8d7] disabled:opacity-60
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <CircleCheckIcon className="h-10 w-10 shrink-0 text-brown" />
          {busy ? '比對中…' : '確認！開始比對尋找'}
        </button>
      </div>

      <TagPickerModal open={pickerOpen} value={tags} onClose={() => setPickerOpen(false)} onConfirm={setTags} />
    </div>
  )
}
