import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  CalendarIcon,
  LocationIcon,
  CircleCheckIcon,
  CameraIcon,
} from '../components/icons'
import RegionRow from '../components/RegionRow'
import { todayStr } from '../lib/date'
import { downscale } from '../lib/image'

function Field({ left, chevron, children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-[46px] shrink-0 items-center justify-center">{left}</div>
      <div className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-[50px] border border-black bg-white px-4">
        {children}
        {chevron && <ChevronDownIcon className="h-[18px] w-[18px] shrink-0 text-navy" />}
      </div>
    </div>
  )
}

const inputClass =
  'min-w-0 flex-1 bg-transparent text-xs text-brown outline-none placeholder:text-hint'

export default function CrossSearchPage() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [mode, setMode] = useState('image') // image | text
  const [photoUrl, setPhotoUrl] = useState('')
  const [photo, setPhoto] = useState(null)
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(todayStr())
  const [placeCity, setPlaceCity] = useState('')
  const [placeDistrict, setPlaceDistrict] = useState('')
  const [remark, setRemark] = useState('')
  const [error, setError] = useState('')

  const place = [placeCity, placeDistrict].filter(Boolean).join(' ') // 遺失地點合併字串

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhoto(file)
    setPhotoUrl(URL.createObjectURL(file))
    e.target.value = ''
  }

  function fileToDataUrl(file) {
    return new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result)
      r.onerror = rej
      r.readAsDataURL(file)
    })
  }

  async function handleSubmit() {
    setError('')
    if (mode === 'image' && !photo) { setError('請先上傳照片'); return }
    if (mode === 'text' && !desc.trim()) { setError('請先描述遺失物特徵'); return }
    // 帶照片的 base64（給 AI 辨識用）+ 文字描述，進 AI 過場頁。
    // 手機實拍照片常達數 MB，先縮圖再送，避免上傳過大失敗（Load failed）並加快上傳。
    const base64Image = photo ? await downscale(await fileToDataUrl(photo)) : null
    navigate('/search/analyzing', {
      state: { mode, date, place, remark, photoUrl, base64Image, desc: desc.trim() },
    })
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-base pb-10">
      {/* Header（cream，80px） */}
      <header className="relative flex h-20 items-center justify-center rounded-b-[20px] bg-card pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute left-[22px] top-1/2 -translate-y-1/2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <ChevronLeftIcon className="h-[26px] w-[26px] text-brown" />
        </button>
        <h1 className="text-xl font-bold text-brown">跨平台尋找遺失物</h1>
      </header>

      <div className="flex flex-col gap-5 px-[26px] pt-5">
        {/* 圖片 / 文字 切換 */}
        <div className="mx-auto flex w-[168px] items-center rounded-[50px] bg-card p-1">
          {[
            { key: 'image', label: '圖片' },
            { key: 'text', label: '文字' },
          ].map((t) => {
            const active = mode === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setMode(t.key)}
                className={`h-[38px] flex-1 rounded-[42px] text-xl text-brown transition
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                  ${active ? 'border border-black bg-input font-medium' : 'font-normal'}`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {/* 圖片模式：拍照上傳 / 文字模式：描述 */}
        {mode === 'image' ? (
          <>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label={photoUrl ? '更換照片' : '上傳照片'}
              className="relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-[10px] border border-black bg-input
                         transition hover:bg-[#eee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="預覽" className="h-full w-full object-contain" />
              ) : (
                <CameraIcon className="h-11 w-11 text-[#1e1e1e]" />
              )}
            </button>
          </>
        ) : (
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="描述遺失物特徵（例如：黑色折疊傘、有貼紙…）"
            className="h-[200px] w-full resize-none rounded-[10px] border border-black bg-input p-4 text-sm text-brown outline-none placeholder:text-brown/60"
          />
        )}

        {/* 日期 / 地點 / 備註 */}
        <div className="flex flex-col gap-[15px] rounded-[10px] bg-card px-4 py-5">
          <Field left={<CalendarIcon className="h-[30px] w-[30px] text-navy" />} chevron>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="遺失日期"
              className={`${inputClass} [&::-webkit-calendar-picker-indicator]:hidden`}
            />
          </Field>
          <RegionRow
            left={<LocationIcon className="h-[30px] w-[26px] text-navy" />}
            prefix="遺失的"
            city={placeCity} setCity={setPlaceCity}
            district={placeDistrict} setDistrict={setPlaceDistrict}
          />
          <Field left={<span className="text-base text-brown">備註</span>}>
            <input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="供Threads發文時提供詳細資訊" className={inputClass} />
          </Field>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        {/* 送出 */}
        <button
          type="button"
          onClick={handleSubmit}
          className="mt-1 flex h-[60px] w-full items-center justify-center gap-4 rounded-[50px] border border-black bg-blue
                     text-base font-medium text-brown transition hover:brightness-[.98]
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <CircleCheckIcon className="h-10 w-10 shrink-0 text-brown" />
          填寫完成，讓AI 辨識產生標籤
        </button>
      </div>
    </div>
  )
}
