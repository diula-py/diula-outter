import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon, PlusIcon } from '../components/icons'
import { FormHeader, FormPage, FormCard, FormRow, RegionField, SubmitButton, pillInput } from '../components/FormKit'
import TagPickerModal from '../components/TagPickerModal'
import { addMyItem } from '../lib/items'
import { useAuth } from '../context/AuthContext'
import { todayStr } from '../lib/date'

/**
 * 登錄拾獲物的「確認標籤」頁（inner page-11）：AI 過場後進來，可改日期／拾獲地點／備註、
 * 增刪 AI 標籤，按「確認標籤，完成登錄」才寫進「我的拾獲物」，再到登錄成功頁。
 * 版面同搜尋流程的確認標籤頁（ConfirmTagsPage），送往地點沿用登錄頁填的值（inner 這頁也沒有這欄）。
 */
export default function RegisterConfirmPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userId } = useAuth()
  const item = location.state?.item

  const [date, setDate] = useState(item?.date || todayStr())
  const [city, setCity] = useState((item?.place || '').split(' ')[0] || '')
  const [district, setDistrict] = useState((item?.place || '').split(' ')[1] || '')
  const [remark, setRemark] = useState(item?.remark || '')
  const [tags, setTags] = useState(item?.tags || [])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // 直接開這個網址、沒有帶資料 → 回首頁。
  useEffect(() => {
    if (!item) navigate('/', { replace: true })
  }, [item, navigate])
  if (!item) return null

  async function handleSubmit() {
    setError('')
    if (tags.length === 0) { setError('請至少選擇一個標籤！'); return }
    setBusy(true)
    try {
      const place = [city, district].filter(Boolean).join(' ') || item.place
      const saved = await addMyItem('found', userId, { ...item, date: date || item.date, place, remark: remark.trim(), tags })
      navigate('/register/success', { replace: true, state: { id: saved.id } })
    } catch (e) {
      console.error('存進「我的拾獲物」失敗:', e)
      setError(`登錄失敗：${e.message}`)
      setBusy(false)
    }
  }

  return (
    <FormPage>
      {/* Header（cream，80px，僅標題、沒有返回鍵；同 inner page-11） */}
      <FormHeader title="確認標籤" />

      <div className="mt-5 h-[200px] w-full max-w-[340px] shrink-0 overflow-hidden rounded-[10px]">
        {item.image && <img src={item.image} alt="" className="h-full w-full bg-input object-contain" />}
      </div>

      {/* 日期 / 拾獲地點 / 備註 */}
      <FormCard mt={20}>
        <FormRow icon={<CalendarIcon className="h-[35px] w-[35px]" />}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="拾獲日期" className={pillInput} />
        </FormRow>
        <RegionField
          icon={<LocationIcon className="h-[35px] w-[35px]" />}
          prefix="拾獲的"
          city={city} setCity={setCity}
          district={district} setDistrict={setDistrict}
        />
        <FormRow text="備註" typing>
          <input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} className={pillInput} />
        </FormRow>
      </FormCard>

      {/* AI 標籤（可增刪）：340 寬、padding 20、標題 16/600、chip 高 30 */}
      <div className="mt-5 box-border min-h-[98px] w-full max-w-[340px] shrink-0 rounded-[10px] bg-card p-5">
        <div className="mb-[10px] text-base font-semibold text-brown">AI 標籤</div>
        <div className="flex flex-wrap gap-[10px]">
          {tags.map((tag) => (
            <div key={tag} className="box-border inline-flex h-[30px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[50px] border border-black bg-blue px-5 py-[10px] text-xs font-normal text-brown">
              {tag}
              <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== tag))} aria-label={`移除 ${tag}`} className="ml-[6px] text-sm font-bold">×</button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="box-border inline-flex h-[30px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[50px] border border-black bg-white px-5 py-[10px] text-xs font-normal text-brown"
          >
            <PlusIcon className="h-3 w-3 shrink-0" />
            新增
          </button>
        </div>
      </div>

      {error && <p className="mt-[15px] w-full max-w-[340px] text-sm leading-normal text-error">{error}</p>}

      <SubmitButton tone="card" onClick={handleSubmit} disabled={busy}>
        {busy ? '正在寫入中...' : '確認標籤，完成登錄'}
      </SubmitButton>

      <TagPickerModal open={pickerOpen} value={tags} onClose={() => setPickerOpen(false)} onConfirm={setTags} />
    </FormPage>
  )
}
