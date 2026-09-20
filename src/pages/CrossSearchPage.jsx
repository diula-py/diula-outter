import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon } from '../components/icons'
import { FormHeader, FormPage, UploadBox, FormCard, FormRow, RegionField, SubmitButton, pillInput } from '../components/FormKit'
import { todayStr } from '../lib/date'
import { downscale } from '../lib/image'

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
    <FormPage>
      <FormHeader title="跨平台尋找遺失物" onBack={() => navigate(-1)} />

      {/* 圖片 / 文字 切換：168×46 米色膠囊，選中態是 76×40、圓角 42（inner Frame 48） */}
      <div className="relative mt-[25px] flex h-[46px] w-[168px] shrink-0 items-center rounded-[50px] bg-card">
        <div
          aria-hidden="true"
          className={`absolute top-[3px] box-border h-[40px] w-[76px] rounded-[42px] border border-black bg-input transition-[left] duration-300
            ${mode === 'image' ? 'left-[6px]' : 'left-[88px]'}`}
        />
        {[
          { key: 'image', label: '圖片' },
          { key: 'text', label: '文字' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setMode(t.key)}
            aria-pressed={mode === t.key}
            className={`relative z-[1] flex-1 text-center text-xl text-brown
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
              ${mode === t.key ? 'font-medium' : 'font-normal'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 圖片模式：拍照上傳 / 文字模式：描述 */}
      {mode === 'image' ? (
        <>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          <UploadBox
            mt={25}
            src={photoUrl}
            alt="預覽"
            ariaLabel={photoUrl ? '更換照片' : '上傳照片'}
            onClick={() => fileRef.current?.click()}
          />
        </>
      ) : (
        <div className="mt-[25px] box-border flex h-[200px] w-full max-w-[340px] shrink-0 rounded-[10px] border border-black bg-input p-5">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="請在此處描述您遺失的物品"
            className="h-full w-full resize-none border-none bg-transparent text-base font-medium leading-normal text-black outline-none placeholder:text-[#888]"
          />
        </div>
      )}

      <FormCard mt={25}>
        <FormRow icon={<CalendarIcon className="h-[35px] w-[35px]" />}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="遺失日期" className={pillInput} />
        </FormRow>
        <RegionField
          icon={<LocationIcon className="h-[35px] w-[35px]" />}
          prefix="遺失的"
          city={placeCity} setCity={setPlaceCity}
          district={placeDistrict} setDistrict={setPlaceDistrict}
        />
        <FormRow text="備註">
          <input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="供Threads發文時提供詳細資訊" className={pillInput} />
        </FormRow>
      </FormCard>

      {error && <p className="mt-[15px] w-full max-w-[340px] text-sm leading-normal text-error">{error}</p>}
      <SubmitButton onClick={handleSubmit}>填寫完成，AI 辨識產生標籤</SubmitButton>
    </FormPage>
  )
}
