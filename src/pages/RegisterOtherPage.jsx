import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon, PersonChalkboardIcon } from '../components/icons'
import { FormHeader, FormPage, UploadBox, FormCard, FormRow, RegionField, SubmitButton, pillInput } from '../components/FormKit'
import { todayStr } from '../lib/date'
import { wakeAi } from '../lib/api'
import { downscale } from '../lib/image'
import { FOUND_STATUS } from '../data/itemStatus'
import { useItemPhoto } from '../components/CropModal'

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

  const { photo, previewUrl, cropped, handlePhoto, recrop, modal: cropModal } = useItemPhoto() // 選照片後自動跳出框選
  const [date, setDate] = useState(todayStr())
  const [foundCity, setFoundCity] = useState('')       // 拾獲地點：縣市
  const [foundDistrict, setFoundDistrict] = useState('') // 拾獲地點：地區
  const [foundDetail, setFoundDetail] = useState('') // 拾獲的詳細地點
  const [sendTo, setSendTo] = useState('') // 送往的詳細地點（只有這一格，存在 dropLocation）
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting
  const [error, setError] = useState('')

  const foundAt = [foundCity, foundDistrict].filter(Boolean).join(' ') // 拾獲地點合併字串

  // 進頁就先喚醒 Render AI 服務（冷啟動 ~60 秒），送出時多半已就緒。
  useEffect(() => { wakeAi() }, [])

  async function handleSubmit() {
    setError('')
    if (!photo) { setError('請上傳拾獲物圖片'); return }
    if (!date) { setError('請選擇拾獲日期'); return }
    if (!foundCity || !foundDistrict) { setError('請選擇拾獲的縣市與地區'); return }
    if (!foundDetail.trim()) { setError('請填寫拾獲的詳細地點'); return }
    if (!sendTo.trim()) { setError('請填寫送往的詳細地點'); return }

    setStatus('submitting')
    // 手機實拍照片常達數 MB，先縮到 1280px / 0.72，base64 通常 <500KB，符合
    // 非證件物品照片「demo 前臨時方案 base64、壓到 ≲700KB」的要求（計畫 3.6 節）。
    // 有框選就用框內範圍（AI 辨識與存檔都用這張）
    const uploadImage = await downscale(cropped || await fileToDataUrl(photo), 1280, 0.72)
    const item = {
      id: 'found_' + Date.now(),
      kind: 'found',
      code: '#' + Date.now().toString().slice(-6),
      date,                          // 拾獲日 YYYY-MM-DD
      place: foundAt,                // 拾獲地點
      location_detail: foundDetail.trim(),      // 拾獲的詳細地點
      dropLocation: sendTo.trim(),   // 送往地點
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
        src={previewUrl}
        alt="預覽"
        ariaLabel={previewUrl ? '更換照片' : '上傳照片'}
        onClick={() => fileRef.current?.click()}
        onRecrop={recrop}
        cropped={!!cropped}
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
        {/* 詳細地點列不放圖示，跟上一列的縣市／地區排在一起 */}
        <FormRow typing>
          <input type="text" value={foundDetail} onChange={(e) => setFoundDetail(e.target.value)} placeholder="拾獲的詳細地點" aria-label="拾獲的詳細地點" className={pillInput} />
        </FormRow>
        <FormRow icon={<PersonChalkboardIcon className="h-[35px] w-[35px]" />} typing>
          <input type="text" value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="送往的詳細地點（例如：文山二分局）" aria-label="送往的詳細地點" className={pillInput} />
        </FormRow>
        <FormRow text="備註" typing>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={pillInput} />
        </FormRow>
      </FormCard>

      {error && <p className="mt-[15px] w-[calc(100%-40px)] max-w-[340px] text-sm leading-normal text-error land:col-start-2 land:mt-0 land:w-full land:max-w-none">{error}</p>}
      <SubmitButton onClick={handleSubmit} disabled={status === 'submitting'}>
        {status === 'submitting' ? '送出中…' : '填寫完成，AI 辨識產生標籤'}
      </SubmitButton>
      {cropModal}
    </FormPage>
  )
}
