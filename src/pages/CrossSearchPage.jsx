import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon } from '../components/icons'
import { FormHeader, FormPage, UploadBox, FormCard, FormRow, RegionField, SubmitButton, pillInput } from '../components/FormKit'
import { todayStr } from '../lib/date'
import { wakeAi, wakeFlask } from '../lib/api'
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
  const [error, setError] = useState('')
  // 送出中：縮圖要幾百毫秒，連點會推兩次過場頁、建出兩筆遺失物。ref 擋同一瞬間的第二下，state 讓按鈕變灰
  const submittingRef = useRef(false)
  const [submitting, setSubmitting] = useState(false)

  const place = [placeCity, placeDistrict].filter(Boolean).join(' ') // 遺失地點合併字串

  // 進頁就先喚醒 Render AI 服務（冷啟動 ~60 秒），送出時多半已就緒。
  useEffect(() => { wakeAi(); wakeFlask() }, [])

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
    if (!date) { setError('請選擇遺失日期'); return }
    if (!placeCity || !placeDistrict) { setError('請選擇遺失的縣市與地區'); return }
    // 帶照片的 base64（給 AI 辨識用）+ 文字描述，進 AI 過場頁。
    // 手機實拍照片常達數 MB，先縮圖再送，避免上傳過大失敗（Load failed）並加快上傳。
    // 只送目前模式的資料：圖片模式送照片、文字模式送描述。
    // 否則在圖片模式上傳過照片再切到文字模式，那張照片仍會被存檔、帶進 Threads 協尋文
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    const isImage = mode === 'image'
    let base64Image = null
    try {
      base64Image = isImage && photo ? await downscale(await fileToDataUrl(photo)) : null
    } catch (e) {
      console.warn('讀取照片失敗：', e)
      setError('照片讀取失敗，請重新上傳')
      submittingRef.current = false
      setSubmitting(false)
      return
    }
    navigate('/search/analyzing', {
      state: { mode, date, place, photoUrl: isImage ? photoUrl : '', base64Image, desc: isImage ? '' : desc.trim() },
    })
  }

  return (
    <FormPage>
      <FormHeader title="跨平台尋找遺失物" onBack={() => navigate(-1)} />

      {/* 圖片 / 文字 切換：168×46 米色膠囊，選中態是 76×40、圓角 42（inner Frame 48） */}
      <div className="relative mt-[25px] flex h-[46px] w-[168px] shrink-0 items-center rounded-[50px] bg-card land:col-span-full land:mt-0 land:justify-self-center">
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
        <div className="mt-[25px] box-border flex h-[200px] w-[calc(100%-40px)] max-w-[340px] shrink-0 rounded-[10px] border border-black bg-input p-5
                        land:col-start-1 land:mt-0 land:h-[150px] land:w-full land:max-w-none">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="請在此處描述您遺失的物品"
            className="h-full w-full resize-none border-none bg-transparent p-3 text-base font-medium leading-normal text-black outline-none placeholder:text-[#888]"
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
      </FormCard>

      {error && <p className="mt-[15px] w-[calc(100%-40px)] max-w-[340px] text-sm leading-normal text-error land:col-start-2 land:mt-0 land:w-full land:max-w-none">{error}</p>}
      <SubmitButton onClick={handleSubmit} disabled={submitting}>
        {submitting ? '送出中…' : '填寫完成，AI 辨識產生標籤'}
      </SubmitButton>
    </FormPage>
  )
}
