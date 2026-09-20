import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon, PlusIcon } from '../components/icons'
import { FormHeader, FormPage, FormCard, FormRow, RegionField, SubmitButton, pillInput } from '../components/FormKit'
import { asset } from '../lib/asset'
import TagPickerModal from '../components/TagPickerModal'
import { flask } from '../lib/api'
import { todayStr } from '../lib/date'

export default function ConfirmTagsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const data = location.state || {}

  const [date, setDate] = useState(data.date || todayStr())
  const [placeCity, setPlaceCity] = useState((data.place || '').split(' ')[0] || '')
  const [placeDistrict, setPlaceDistrict] = useState((data.place || '').split(' ')[1] || '')
  const [remark, setRemark] = useState(data.remark || '')
  const [tags, setTags] = useState(data.tags || ['杯套', '水杯'])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const place = [placeCity, placeDistrict].filter(Boolean).join(' ') // 遺失地點合併字串

  function removeTag(t) {
    setTags((prev) => prev.filter((x) => x !== t))
  }

  async function handleConfirm() {
    setError('')
    if (tags.length === 0) { setError('至少要有一個標籤才能比對'); return }
    setBusy(true)
    try {
      const res = await fetch(flask('/match'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lost_date: date,       // YYYY-MM-DD
          tags,                  // 後端用標籤正規化出分類與顏色
          city: placeCity || null,          // 縣市：後端的硬條件閘門要用（沒送＝不篩＝跨縣市）
          district: placeDistrict || null,  // 行政區：後端用於計分細分
          detail: place,         // 詳細地點（會接在協尋文後、也用於地點加分）
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `伺服器回應 ${res.status}`)
      navigate('/search/results', { state: { query: { date, place, tags }, base64Image: data.base64Image, ...json } })
    } catch (e) {
      setError(`比對失敗：${e.message}（請確認 Flask :5001 有啟動）`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <FormPage>
      {/* Header（cream，80px，僅標題、沒有返回鍵） */}
      <FormHeader title={data.name || '確認標籤'} />

      {/* 圖片模式：340×200；文字模式：米色卡片＋筆圖示＋描述（inner page-05） */}
      {data.mode === 'text' ? (
        <div className="mt-5 box-border flex w-full max-w-[340px] shrink-0 items-center gap-[15px] rounded-[10px] bg-card p-[15px]">
          <img src={asset('/icons/square-pen.png')} alt="" aria-hidden="true" className="h-10 w-10 shrink-0 object-contain" />
          <div className="min-w-0 flex-1 break-words text-sm font-normal leading-normal text-brown">{data.desc}</div>
        </div>
      ) : (
        <div className="mt-5 h-[200px] w-full max-w-[340px] shrink-0 overflow-hidden rounded-[10px]">
          {data.photoUrl && <img src={data.photoUrl} alt="" className="h-full w-full bg-input object-contain" />}
        </div>
      )}

      {/* 日期 / 地點 / 備註 */}
      <FormCard mt={20}>
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

      {/* AI 標籤（可增刪）：340 寬、padding 20、標題 16/700、chip 高 30 */}
      <div className="mt-5 box-border min-h-[98px] w-full max-w-[340px] shrink-0 rounded-[10px] bg-card p-5">
        <div className="mb-[10px] text-base font-bold text-brown">AI 標籤</div>
        <div className="flex flex-wrap gap-[10px]">
          {tags.map((tag) => (
            <div key={tag} className="box-border inline-flex h-[30px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[50px] border border-black bg-blue px-5 py-[10px] text-xs font-normal text-brown">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} aria-label={`移除 ${tag}`} className="ml-[6px] text-sm font-bold">×</button>
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

      <SubmitButton tone="card" onClick={handleConfirm} disabled={busy}>
        {busy ? '比對中…' : '確認！開始比對尋找'}
      </SubmitButton>

      <TagPickerModal open={pickerOpen} value={tags} onClose={() => setPickerOpen(false)} onConfirm={setTags} />
    </FormPage>
  )
}
