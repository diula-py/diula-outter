import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon, PersonChalkboardIcon, ChevronLeftIcon, ChevronDownIcon } from '../components/icons'
import { FormHeader, FormPage, UploadBox, FormCard, FormRow, RegionField, SubmitButton, pillInput } from '../components/FormKit'
import DesktopTopNav from '../components/DesktopTopNav'
import DesktopFooter from '../components/DesktopFooter'
import { CITY_ORDER, TAIWAN_REGIONS } from '../data/taiwanRegions'
import { asset } from '../lib/asset'
import { todayStr } from '../lib/date'
import { wakeAi, wakeFlask } from '../lib/api'
import { downscale } from '../lib/image'
import { FOUND_STATUS } from '../data/itemStatus'
import { useItemPhoto } from '../components/CropModal'
import { useOnline } from '../lib/useOnline'

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
  const online = useOnline() // 離線：跳過 AI 辨識，直接到確認頁手動選標籤（存檔走 Firestore 離線佇列）

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

  // 進頁就先喚醒兩層服務，讓冷啟動並行而不是疊加：
  // AI 辨識現在改走 Flask 代理（/ai/analyze-item，見 lib/api.js 的說明），
  // 送出時要 Flask 醒著才轉發得到 AI 服務，少喚醒這層的話，原本 wakeAi()
  // 幫 AI 服務爭取到的開機時間，會被「使用者按送出才開始醒的 Flask」吃掉。
  useEffect(() => { wakeAi(); wakeFlask() }, [])

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
    // 離線 → AI 服務連不到，直接到確認頁讓使用者自己選標籤。
    // （連到沒有對外網路的 Wi-Fi 時 navigator.onLine 還是 true，會走 AI 那條，AI 失敗一樣會進確認頁。）
    if (!navigator.onLine) {
      navigate('/register/confirm', { state: { item, manualTags: true } })
      return
    }
    // 送出後 → AI 辨識過場頁：自動補標籤後存進「我的拾獲物」（同證件類登錄，共用同一頁）。
    navigate('/register/analyzing', {
      state: { item, base64Image: uploadImage, desc: note.trim() },
    })
  }

  return (
    <>
    {/* ======== 手機／手機橫放：維持原本版型，桌機（lg:）整個藏起來 ======== */}
    <div className="lg:hidden">
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
          {status === 'submitting' ? '送出中…' : online ? '填寫完成，AI 辨識產生標籤' : '填寫完成，手動選擇標籤'}
        </SubmitButton>
      </FormPage>
    </div>

    {/* ======== 桌機（lg:）：照 2026-11 Figma「非證件類遺失物登錄」CSS。跟證件類登錄頁
        同一套 768 置中欄做法，差在沒有證件類型分頁、上傳用一般拍照框選（不是打碼視窗）。
        CSS 一樣漏畫「拾獲的詳細地點」這格（必填，handleSubmit 會擋），照手機版補回來。
        這頁確認標籤的「圖二」畫面其實是送出後跳轉到的 ConfirmTagsPage／RegisterConfirmPage，
        已經在那兩支檔案各自做過桌機版了，這裡不重複做。 ======== */}
    <div className="hidden min-h-screen w-full flex-col items-center bg-paper lg:flex">
      <DesktopTopNav />

      <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-8 px-6 pb-16 pt-10 box-border">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} aria-label="返回" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center">
            <ChevronLeftIcon className="h-[30px] w-[30px] text-brown" />
          </button>
          <h1 className="m-0 text-2xl font-normal text-brown">非證件類遺失物登錄</h1>
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        <div className="relative h-[300px] w-full overflow-hidden rounded-lg border border-black bg-white">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label={previewUrl ? '更換照片' : '上傳照片'}
            className="flex h-full w-full items-center justify-center"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="預覽" className="h-full w-full object-contain" />
            ) : (
              <img src={asset('/icons/camera.png')} alt="" className="h-10 w-10 object-contain" />
            )}
          </button>
          {previewUrl && cropped && (
            <span className="pointer-events-none absolute right-3 top-3 rounded-[6px] bg-[#D5EBD6] px-2 py-1 text-xs font-normal text-brown">已框選</span>
          )}
          {previewUrl && (
            <button
              type="button"
              onClick={recrop}
              className="absolute bottom-3 right-3 rounded-full border border-black bg-input px-3 py-1 text-xs font-normal text-brown transition hover:bg-[#ececec]"
            >
              {cropped ? '重新框選' : '框選物品'}
            </button>
          )}
        </div>

        <div className="flex h-[58px] w-full items-center rounded-full border border-black bg-white px-4">
          <CalendarIcon className="h-5 w-5 shrink-0 text-[#6B7280]" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="拾獲日期"
            className="h-6 w-full bg-transparent px-3 text-base text-brown outline-none"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex h-[58px] flex-1 items-center rounded-full border border-black bg-white px-4">
            <select
              value={foundCity}
              onChange={(e) => { setFoundCity(e.target.value); setFoundDistrict('') }}
              aria-label="拾獲的縣市"
              className="h-6 w-full appearance-none bg-transparent text-base text-brown outline-none"
            >
              <option value="">選擇拾獲的縣市</option>
              {CITY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDownIcon className="pointer-events-none h-4 w-4 shrink-0 text-[#6B7280]" />
          </div>
          <div className="flex h-[58px] flex-1 items-center rounded-full border border-black bg-white px-4">
            <select
              value={foundDistrict}
              onChange={(e) => setFoundDistrict(e.target.value)}
              disabled={!foundCity}
              aria-label="拾獲的地區"
              className="h-6 w-full appearance-none bg-transparent text-base text-brown outline-none"
            >
              <option value="">選擇拾獲的地區</option>
              {(TAIWAN_REGIONS[foundCity] || []).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDownIcon className="pointer-events-none h-4 w-4 shrink-0 text-[#6B7280]" />
          </div>
        </div>

        <input
          type="text"
          value={foundDetail}
          onChange={(e) => setFoundDetail(e.target.value)}
          placeholder="拾獲的詳細地點"
          aria-label="拾獲的詳細地點"
          className="flex h-[58px] w-full items-center rounded-full border border-black bg-white px-6 text-base text-brown outline-none placeholder:text-[#888]"
        />

        <input
          type="text"
          value={sendTo}
          onChange={(e) => setSendTo(e.target.value)}
          placeholder="選擇送往的地點（例如：文山二分局）"
          aria-label="送往的詳細地點"
          className="flex h-[58px] w-full items-center rounded-full border border-black bg-white px-6 text-base text-brown outline-none placeholder:text-[#888]"
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="備註（非必填）"
          className="h-[106px] w-full resize-none rounded-lg border border-black bg-white p-4 text-base text-brown outline-none placeholder:text-[#888]"
        />

        {error && <p className="m-0 text-sm leading-normal text-error">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={status === 'submitting'}
          className="flex h-20 w-full items-center justify-center rounded-full border-2 border-black bg-[#F7F4E5] text-xl text-brown transition hover:brightness-[.98] disabled:opacity-60"
        >
          {status === 'submitting' ? '送出中…' : online ? '填寫完成，AI 辨識產生標籤' : '填寫完成，手動選擇標籤'}
        </button>
      </div>

      <DesktopFooter />
    </div>

    {cropModal}
    </>
  )
}
