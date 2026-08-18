import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  CalendarIcon,
  LocationIcon,
  PersonChalkboardIcon,
  CircleCheckIcon,
  CameraIcon,
} from '../components/icons'
import MaskingModal from '../components/MaskingModal'
import { CITY_ORDER, TAIWAN_REGIONS } from '../data/taiwanRegions'
import { addItem } from '../lib/myItems'
import { spring } from '../lib/api'

// 分頁中文 → 後端 docType 列舉
const DOCTYPE_MAP = {
  身份證: 'national_id',
  健保卡: 'health_card',
  學生證: 'student_id',
  其他: 'other',
}
const ID_TYPES = Object.keys(DOCTYPE_MAP)

// ⚠️ Spring Boot /api/id-cards 故意只允許同源。dev 走 proxy；prod 需前端與 Spring Boot
// 同網域，或在 IdCardController 加 CORS，否則會被擋。
const SUBMIT_ENDPOINT = spring('/api/id-cards')

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

// 地點下拉：select 佔滿整格、箭頭疊在右側且 pointer-events-none，
// 這樣連箭頭都能點開原生下拉（不用 Field 自帶的箭頭）。
function SelectField({ left, value, onChange, disabled, placeholder, children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-[46px] shrink-0 items-center justify-center">{left}</div>
      <div className="relative flex h-10 min-w-0 flex-1 items-center rounded-[50px] border border-black bg-white px-4">
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

export default function RegisterIdPage() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [type, setType] = useState('身份證')
  const [pendingFile, setPendingFile] = useState(null)   // 待打碼的原始照片（只留在本機）
  const [maskedImage, setMaskedImage] = useState('')     // 打碼後 JPEG data URL（唯一會送出的圖）
  const [maskInfo, setMaskInfo] = useState(null)         // { maskRegionCount, manual }
  const [date, setDate] = useState('2026-05-07')
  const [foundCity, setFoundCity] = useState('')       // 拾獲地點：縣市
  const [foundDistrict, setFoundDistrict] = useState('') // 拾獲地點：地區
  const [sendTo, setSendTo] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [error, setError] = useState('')

  const foundAt = [foundCity, foundDistrict].filter(Boolean).join(' ') // 拾獲地點合併字串

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (file) setPendingFile(file) // → 開打碼視窗
    e.target.value = '' // 讓同一張照片能重選
  }

  function onMaskDone({ image, maskRegionCount, manual }) {
    setMaskedImage(image)
    setMaskInfo({ maskRegionCount, manual })
    setPendingFile(null)
  }

  async function handleSubmit() {
    setError('')
    if (!maskedImage || !maskInfo) { setError('請先拍照並完成打碼'); return }
    if (!sendTo.trim()) { setError('請填寫送往的地點'); return }

    const payload = {
      docType: DOCTYPE_MAP[type],
      maskRegionCount: maskInfo.maskRegionCount,
      manual: maskInfo.manual,
      date,                 // 拾獲日 YYYY-MM-DD
      location: foundAt,    // 拾獲地點
      dropLocation: sendTo, // 送往地點
      remark: note,         // 備註
      image: maskedImage,
    }

    setStatus('submitting')
    try {
      const res = await fetch(SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `伺服器回應 ${res.status}`)
      // 存進「我的拾獲物」本機紀錄（kind: 'found'），讓登錄的拾獲物出現在清單。
      // TODO: 接使用者後端後改讀 API，這段本機保存可移除。
      addItem({
        id: 'found_' + Date.now(),
        kind: 'found',
        code: '#' + (data.id ? String(data.id).slice(-6) : Date.now().toString().slice(-6)),
        name: type,                    // 證件別（身份證／健保卡…）
        date,                          // 拾獲日 YYYY-MM-DD
        place: foundAt,                // 拾獲地點
        dropLocation: sendTo,          // 送往地點
        remark: note.trim(),
        tags: [type],
        image: maskedImage,
        docType: DOCTYPE_MAP[type],
        created_at: new Date().toISOString(),
      })
      setStatus('success')
    } catch (e) {
      setStatus('error')
      setError(`送出失敗：${e.message}`)
    }
  }

  function resetForm() {
    setMaskedImage(''); setMaskInfo(null)
    setFoundCity(''); setFoundDistrict(''); setSendTo(''); setNote('')
    setStatus('idle'); setError('')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-base pb-10">
      {/* Header */}
      <header className="relative flex h-20 items-center justify-center rounded-b-[20px] bg-card pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute left-[22px] top-1/2 -translate-y-1/2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <ChevronLeftIcon className="h-6 w-6 text-brown" />
        </button>
        <h1 className="text-xl font-bold text-brown">證件類遺失物登錄</h1>
      </header>

      <div className="flex flex-col gap-5 px-[26px] pt-6">
        {/* 證件類型分頁 */}
        <div className="flex justify-between">
          {ID_TYPES.map((t) => {
            const active = type === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={active}
                className={`h-[45px] w-20 rounded-[50px] text-base text-brown transition
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                  ${active ? 'border-[1.5px] border-black bg-card font-medium' : 'border border-black bg-input font-normal'}`}
              >
                {t}
              </button>
            )
          })}
        </div>

        {/* 拍照上傳（點擊 → 選圖 → 打碼視窗） */}
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label={maskedImage ? '更換照片' : '上傳照片'}
          className="relative flex h-[200px] w-full items-center justify-center overflow-hidden rounded-[10px] border border-black bg-input
                     transition hover:bg-[#eee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          {maskedImage ? (
            <>
              <img src={maskedImage} alt="已打碼證件" className="h-full w-full object-contain" />
              <span className="absolute bottom-2 right-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white">
                已打碼 · 更換
              </span>
            </>
          ) : (
            <CameraIcon className="h-11 w-11 text-[#1e1e1e]" />
          )}
        </button>

        {/* 表單卡片 */}
        <div className="flex flex-col gap-[15px] rounded-[10px] bg-card px-4 py-5">
          <Field left={<CalendarIcon className="h-[30px] w-[30px] text-navy" />} chevron>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="拾獲日期"
              className={`${inputClass} [&::-webkit-calendar-picker-indicator]:hidden`}
            />
          </Field>
          <SelectField
            left={<LocationIcon className="h-[30px] w-[26px] text-navy" />}
            value={foundCity}
            onChange={(e) => { setFoundCity(e.target.value); setFoundDistrict('') }}
            placeholder="拾獲的地點（縣市）"
          >
            {CITY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <SelectField
            left={<LocationIcon className="h-[30px] w-[26px] text-navy" />}
            value={foundDistrict}
            onChange={(e) => setFoundDistrict(e.target.value)}
            disabled={!foundCity}
            placeholder="拾獲的地點（地區）"
          >
            {(TAIWAN_REGIONS[foundCity] || []).map((d) => <option key={d} value={d}>{d}</option>)}
          </SelectField>
          <Field left={<PersonChalkboardIcon className="h-[26px] w-[32px] text-navy" />}>
            <input type="text" value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="送往的地點 *" className={inputClass} />
          </Field>
          <Field left={<span className="text-base text-brown">備註</span>}>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="供Threads發文時提供詳細資訊" className={inputClass} />
          </Field>
        </div>

        {/* 送出 / 結果 */}
        {status === 'success' ? (
          <div className="mt-2 flex flex-col items-center gap-3 rounded-[50px] border border-black bg-blue px-6 py-5 text-center">
            <div className="flex items-center gap-2 text-base font-medium text-brown">
              <CircleCheckIcon className="h-7 w-7 text-brown" />
              已送出，並為該筆資料新增標籤
            </div>
            <button type="button" onClick={resetForm} className="text-sm text-brown underline underline-offset-4">
              再登錄一筆
            </button>
          </div>
        ) : (
          <>
            {error && <p className="text-sm text-error">{error}</p>}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === 'submitting'}
              className="mt-2 flex h-[60px] w-full items-center justify-center gap-4 rounded-[50px] border border-black bg-blue
                         text-base font-medium text-brown transition hover:brightness-[.98] disabled:opacity-60
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <CircleCheckIcon className="h-10 w-10 shrink-0 text-brown" />
              {status === 'submitting' ? '送出中…' : '填寫完成，為該筆資料新增標籤'}
            </button>
          </>
        )}
      </div>

      {/* 打碼視窗 */}
      {pendingFile && (
        <MaskingModal
          file={pendingFile}
          docType={DOCTYPE_MAP[type]}
          onCancel={() => setPendingFile(null)}
          onConfirm={onMaskDone}
        />
      )}
    </div>
  )
}
