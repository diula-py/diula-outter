import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  CalendarIcon,
  LocationIcon,
  PersonChalkboardIcon,
  CircleCheckIcon,
} from '../components/icons'
import RegionRow from '../components/RegionRow'
import { todayStr } from '../lib/date'
import { downscale } from '../lib/image'
import { asset } from '../lib/asset'
import { FOUND_STATUS } from '../data/itemStatus'

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

function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

export default function RegisterOtherPage() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [photo, setPhoto] = useState(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [date, setDate] = useState(todayStr())
  const [foundCity, setFoundCity] = useState('')       // 拾獲地點：縣市
  const [foundDistrict, setFoundDistrict] = useState('') // 拾獲地點：地區
  const [sendTo, setSendTo] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting
  const [error, setError] = useState('')

  const foundAt = [foundCity, foundDistrict].filter(Boolean).join(' ') // 拾獲地點合併字串

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhoto(file)
    setPhotoUrl(URL.createObjectURL(file))
    e.target.value = '' // 讓同一張照片能重選
  }

  async function handleSubmit() {
    setError('')
    if (!photo) { setError('請上傳拾獲物圖片'); return }
    if (!date) { setError('請選擇拾獲日期'); return }
    if (!foundCity || !foundDistrict) { setError('請選擇拾獲的縣市與地區'); return }
    if (!sendTo.trim()) { setError('請填寫送往的地點'); return }

    setStatus('submitting')
    // 手機實拍照片常達數 MB，先縮到 1280px / 0.72，base64 通常 <500KB，符合
    // 非證件物品照片「demo 前臨時方案 base64、壓到 ≲700KB」的要求（計畫 3.6 節）。
    const uploadImage = await downscale(await fileToDataUrl(photo), 1280, 0.72)
    const item = {
      id: 'found_' + Date.now(),
      kind: 'found',
      code: '#' + Date.now().toString().slice(-6),
      date,                          // 拾獲日 YYYY-MM-DD
      place: foundAt,                // 拾獲地點
      dropLocation: sendTo,          // 送往地點
      remark: note.trim(),
      tags: [],                      // 沒有固定品名／類型，AI 會補標籤
      image: uploadImage,
      status: FOUND_STATUS.KEEPING,
      created_at: new Date().toISOString(),
    }
    // 送出後 → AI 辨識過場頁：自動補標籤後存進「我的拾獲物」（同證件類登錄，共用同一頁）。
    navigate('/register/analyzing', {
      state: { item, base64Image: uploadImage, desc: note.trim() },
    })
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-base pb-10">
      {/* Header */}
      <header className="relative flex h-20 items-center justify-center rounded-b-[20px] bg-card pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute left-[22px] top-1/2 -translate-y-1/2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <ChevronLeftIcon className="h-[30px] w-[30px] text-brown" />
        </button>
        <h1 className="text-xl font-bold text-brown">非證件類遺失物登錄</h1>
      </header>

      <div className="flex flex-col gap-5 px-[26px] pt-6">
        {/* 拍照上傳 */}
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
            <img src={asset('/icons/camera.png')} alt="上傳照片" className="h-8 w-auto object-contain" />
          )}
        </button>

        {/* 表單卡片 */}
        <div className="flex flex-col gap-[15px] rounded-[10px] bg-card px-4 py-5">
          <Field left={<CalendarIcon className="h-[35px] w-[35px] text-navy" />} chevron>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="拾獲日期"
              className={`${inputClass} [&::-webkit-calendar-picker-indicator]:hidden`}
            />
          </Field>
          <RegionRow
            left={<LocationIcon className="h-[35px] w-[35px] text-navy" />}
            prefix="拾獲的"
            city={foundCity} setCity={setFoundCity}
            district={foundDistrict} setDistrict={setFoundDistrict}
          />
          <Field left={<PersonChalkboardIcon className="h-[35px] w-[35px] text-navy" />}>
            <input type="text" value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="送往的地點 *" className={inputClass} />
          </Field>
          <Field left={<span className="text-base text-brown">備註</span>}>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="供Threads發文時提供詳細資訊" className={inputClass} />
          </Field>
        </div>

        {/* 送出 */}
        {error && <p className="text-sm leading-normal text-error">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === 'submitting'}
          className="mt-2 flex h-[60px] w-full items-center justify-center gap-4 rounded-[50px] border border-black bg-blue
                     text-base font-medium text-brown transition hover:brightness-[.98] disabled:opacity-60
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <CircleCheckIcon className="h-10 w-10 shrink-0 text-brown" />
          {status === 'submitting' ? '送出中…' : '填寫完成，AI 辨識產生標籤'}
        </button>
      </div>
    </div>
  )
}
