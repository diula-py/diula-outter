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
import RegionRow from '../components/RegionRow'
import TagPickerModal from '../components/TagPickerModal'
import { addItem } from '../lib/myItems'
import { spring } from '../lib/api'
import { todayStr } from '../lib/date'
import { downscale } from '../lib/image'

// 分頁中文 → 後端 docType 列舉
const DOCTYPE_MAP = {
  身份證: 'national_id',
  健保卡: 'health_card',
  學生證: 'student_id',
  其他: 'other',
}
const ID_TYPES = Object.keys(DOCTYPE_MAP)

// 「其他」證件的細分類型（身分證／健保卡／學生證已是獨立分頁）。選了拿來當品名/標籤，
// 後端 docType 仍送 'other'（列舉只有 4 種），細類型記在本機紀錄的 name/tags 供顯示。
const OTHER_DOC_TYPES = ['護照', '存摺', '印章', '駕照', '行照', '居留證', '自然人憑證', '執照', '證書']
// 給 TagPickerModal 用的分類清單（只有「其他證件」這一組）
const OTHER_DOC_TAXONOMY = [{ category: '其他證件', tags: OTHER_DOC_TYPES }]

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

export default function RegisterIdPage() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [type, setType] = useState('身份證')
  const [otherType, setOtherType] = useState('')         // 「其他」分頁選的細證件類型（單選）
  const [pickerOpen, setPickerOpen] = useState(false)    // 其他證件類型選擇彈窗
  const [pendingFile, setPendingFile] = useState(null)   // 待打碼的原始照片（只留在本機）
  const [maskedImage, setMaskedImage] = useState('')     // 打碼後 JPEG data URL（唯一會送出的圖）
  const [maskInfo, setMaskInfo] = useState(null)         // { maskRegionCount, manual }
  const [date, setDate] = useState(todayStr())
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
    if (type === '其他' && !otherType) { setError('請選擇證件類型'); return }
    if (!sendTo.trim()) { setError('請填寫送往的地點'); return }

    // 品名/標籤用實際證件類型：「其他」用選的細類（護照…），其餘用分頁名。
    const docLabel = type === '其他' ? otherType : type
    setStatus('submitting')
    // 手機實拍照片打碼後 base64 常達數 MB，超過後端 2MB 上限會 413（顯示 Load failed）→ 先縮圖。
    const uploadImage = await downscale(maskedImage)
    const payload = {
      docType: DOCTYPE_MAP[type],
      maskRegionCount: maskInfo.maskRegionCount,
      manual: maskInfo.manual,
      date,                 // 拾獲日 YYYY-MM-DD
      location: foundAt,    // 拾獲地點
      dropLocation: sendTo, // 送往地點
      remark: note,         // 備註
      image: uploadImage,
    }

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
        name: docLabel,                // 證件別（身份證／健保卡／護照…）
        date,                          // 拾獲日 YYYY-MM-DD
        place: foundAt,                // 拾獲地點
        dropLocation: sendTo,          // 送往地點
        remark: note.trim(),
        tags: [docLabel],
        image: uploadImage,
        docType: DOCTYPE_MAP[type],
        created_at: new Date().toISOString(),
      })
      // 登錄成功 → 直接跳「我的拾獲物」，新登錄那筆會出現在清單。
      navigate('/my/found')
    } catch (e) {
      setStatus('error')
      setError(`送出失敗：${e.message}`)
    }
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
                onClick={() => {
                  setType(t)
                  if (t === '其他') setPickerOpen(true) // 點「其他」直接跳選擇彈窗
                  else setOtherType('')
                }}
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

        {/* 「其他」已選的證件類型 → 顯示一顆可再點開重選的膠囊 */}
        {type === '其他' && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={`-mt-1 w-fit rounded-[50px] border border-black px-4 py-1.5 text-sm transition
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
              ${otherType ? 'bg-blue font-medium text-brown' : 'bg-white text-hint'}`}
          >
            {otherType || '選擇證件類型'}
          </button>
        )}

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
          <RegionRow
            left={<LocationIcon className="h-[30px] w-[26px] text-navy" />}
            prefix="拾獲的"
            city={foundCity} setCity={setFoundCity}
            district={foundDistrict} setDistrict={setFoundDistrict}
          />
          <Field left={<PersonChalkboardIcon className="h-[26px] w-[32px] text-navy" />}>
            <input type="text" value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="送往的地點 *" className={inputClass} />
          </Field>
          <Field left={<span className="text-base text-brown">備註</span>}>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="供Threads發文時提供詳細資訊" className={inputClass} />
          </Field>
        </div>

        {/* 送出 */}
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

      {/* 其他證件類型選擇彈窗（單選、只有其他證件那組） */}
      <TagPickerModal
        open={pickerOpen}
        value={otherType ? [otherType] : []}
        taxonomy={OTHER_DOC_TAXONOMY}
        single
        onClose={() => setPickerOpen(false)}
        onConfirm={(arr) => setOtherType(arr[0] || '')}
      />
    </div>
  )
}
