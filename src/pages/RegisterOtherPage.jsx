import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon, PersonChalkboardIcon } from '../components/icons'
import { FormHeader, FormPage, UploadBox, FormCard, FormRow, RegionField, SubmitButton, pillInput } from '../components/FormKit'
import { todayStr } from '../lib/date'
import { downscale } from '../lib/image'
import { FOUND_STATUS } from '../data/itemStatus'

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
    <FormPage>
      <FormHeader title="非證件類遺失物登錄" onBack={() => navigate(-1)} />

      <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
      <UploadBox
        mt={40}
        src={photoUrl}
        alt="預覽"
        ariaLabel={photoUrl ? '更換照片' : '上傳照片'}
        onClick={() => fileRef.current?.click()}
      />

      <FormCard mt={40}>
        <FormRow icon={<CalendarIcon className="h-[35px] w-[35px]" />}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="拾獲日期" className={pillInput} />
        </FormRow>
        <RegionField
          icon={<LocationIcon className="h-[35px] w-[35px]" />}
          prefix="拾獲的"
          city={foundCity} setCity={setFoundCity}
          district={foundDistrict} setDistrict={setFoundDistrict}
        />
        <FormRow icon={<PersonChalkboardIcon className="h-[35px] w-[35px]" />}>
          <input type="text" value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="送往的地點" className={pillInput} />
        </FormRow>
        <FormRow text="備註">
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="供Threads發文時提供詳細資訊" className={pillInput} />
        </FormRow>
      </FormCard>

      {error && <p className="mt-[15px] w-full max-w-[340px] text-sm leading-normal text-error">{error}</p>}
      <SubmitButton onClick={handleSubmit} disabled={status === 'submitting'}>
        {status === 'submitting' ? '送出中…' : '填寫完成，AI 辨識產生標籤'}
      </SubmitButton>
    </FormPage>
  )
}
