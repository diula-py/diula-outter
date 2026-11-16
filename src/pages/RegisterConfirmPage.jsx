import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon, PersonChalkboardIcon, PlusIcon, CircleCheckIcon, ChevronDownIcon } from '../components/icons'
import { FormHeader, FormPage, FormCard, FormRow, RegionField, SubmitButton, pillInput } from '../components/FormKit'
import TagPickerModal from '../components/TagPickerModal'
import DesktopTopNav from '../components/DesktopTopNav'
import DesktopFooter from '../components/DesktopFooter'
import { CITY_ORDER, TAIWAN_REGIONS } from '../data/taiwanRegions'
import { addMyItem } from '../lib/items'
import { useAuth } from '../context/AuthContext'
import { todayStr } from '../lib/date'
import { friendlyError } from '../lib/errors'

/**
 * 登錄拾獲物的「確認標籤」頁（inner page-11）：可改日期／拾獲地點／備註，按
 * 「確認標籤，完成登錄」才寫進「我的拾獲物」，再到登錄成功頁。
 * 證件類（RegisterIdPage）直接進來、標籤固定成選好的證件別；非證件類先過 AI 辨識頁、標籤可增刪。
 * 版面同搜尋流程的確認標籤頁（ConfirmTagsPage）；拾獲／送往的詳細地點也能在這裡再改（inner 這頁沒有送往欄）。
 */
export default function RegisterConfirmPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userId } = useAuth()
  const item = location.state?.item
  // 離線登錄時跳過了 AI 辨識，標籤全部由使用者自己選（標題不寫「AI 標籤」）
  const manualTags = Boolean(location.state?.manualTags)

  const [date, setDate] = useState(item?.date || todayStr())
  const [city, setCity] = useState((item?.place || '').split(' ')[0] || '')
  const [district, setDistrict] = useState((item?.place || '').split(' ')[1] || '')
  const [foundDetail, setFoundDetail] = useState(item?.location_detail || '')
  const [sendTo, setSendTo] = useState(item?.dropLocation || '') // 送往的詳細地點
  const [remark, setRemark] = useState(item?.remark || '')
  const [tags, setTags] = useState(item?.tags || [])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // 證件類登錄（有 docType）：前一頁選了什麼證件就是什麼標籤，整組鎖住——不能刪、不能新增，
  // 也不跑 AI 辨識。非證件類（RegisterOtherPage，沒有 docType）才保留 AI 標籤的增刪。
  const fixedTags = Boolean(item?.docType)

  // 直接開這個網址、沒有帶資料 → 回首頁。
  useEffect(() => {
    if (!item) navigate('/', { replace: true })
  }, [item, navigate])
  if (!item) return null

  async function handleSubmit() {
    setError('')
    if (!date) { setError('請選擇拾獲日期'); return }
    if (!city || !district) { setError('請選擇拾獲的縣市與地區'); return }
    if (!foundDetail.trim()) { setError('請填寫拾獲的詳細地點'); return }
    if (!sendTo.trim()) { setError('請填寫送往的詳細地點'); return }
    if (tags.length === 0) { setError('請至少選擇一個標籤！'); return }
    setBusy(true)
    try {
      const place = [city, district].filter(Boolean).join(' ') || item.place
      // 非證件類允許離線先存在手機（Firestore 離線佇列），證件類一定要連線（見 lib/items.js 的 allowQueue）
      const saved = await addMyItem('found', userId, {
        ...item, date: date || item.date, place, remark: remark.trim(), tags,
        location_detail: foundDetail.trim(), dropLocation: sendTo.trim(),
      }, { allowQueue: !fixedTags })
      navigate('/register/success', { replace: true, state: { id: saved.id, queued: saved.queued } })
    } catch (e) {
      console.error('存進「我的拾獲物」失敗:', e)
      setError(`登錄失敗：${friendlyError(e)}`)
      setBusy(false)
    }
  }

  return (
    <>
    {/* ======== 手機／手機橫放：維持原本版型，桌機（lg:）整個藏起來 ======== */}
    <div className="lg:hidden">
      <FormPage>
        {/* Header（cream，80px，僅標題、沒有返回鍵；同 inner page-11） */}
        <FormHeader title="確認標籤" />

        <div className="mt-5 h-[200px] w-[calc(100%-40px)] max-w-[340px] shrink-0 overflow-hidden rounded-[10px]
                        land:col-start-1 land:mt-0 land:h-[150px] land:w-full land:max-w-none">
          {item.image && <img src={item.image} alt="" className="h-full w-full bg-input object-contain" />}
        </div>

        {/* 日期 / 拾獲地點＋詳細 / 送往 / 備註 */}
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
          <FormRow typing>
            <input type="text" value={foundDetail} onChange={(e) => setFoundDetail(e.target.value)} placeholder="拾獲的詳細地點" aria-label="拾獲的詳細地點" className={pillInput} />
          </FormRow>
          <FormRow icon={<PersonChalkboardIcon className="h-[35px] w-[35px]" />} typing>
            <input type="text" value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="送往的詳細地點（例如：文山二分局）" aria-label="送往的詳細地點" className={pillInput} />
          </FormRow>
          <FormRow text="備註" typing>
            <input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} className={pillInput} />
          </FormRow>
        </FormCard>

        {/* 標籤：340 寬、padding 20、標題 16/600、chip 高 30。
            證件類只顯示選好的證件別（不可增刪）；非證件類是 AI 標籤、可增刪 */}
        <div className="mt-5 box-border min-h-[98px] w-[calc(100%-40px)] max-w-[340px] shrink-0 rounded-[10px] bg-card p-5
                        land:col-start-2 land:mt-0 land:w-full land:max-w-none">
          <div className="mb-[10px] text-base font-semibold text-brown">{fixedTags || manualTags ? '標籤' : 'AI 標籤'}</div>
          <div className="flex flex-wrap gap-[10px]">
            {tags.map((tag) => (
              <div key={tag} className="box-border inline-flex h-[30px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[50px] border border-black bg-blue px-5 py-[10px] text-xs font-normal text-brown">
                {tag}
                {!fixedTags && (
                  <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== tag))} aria-label={`移除 ${tag}`} className="ml-[6px] text-sm font-bold">×</button>
                )}
              </div>
            ))}
            {!fixedTags && (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="box-border inline-flex h-[30px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[50px] border border-black bg-white px-5 py-[10px] text-xs font-normal text-brown"
              >
                <PlusIcon className="h-3 w-3 shrink-0" />
                新增
              </button>
            )}
          </div>
        </div>

        {error && <p className="mt-[15px] w-[calc(100%-40px)] max-w-[340px] text-sm leading-normal text-error land:col-start-2 land:mt-0 land:w-full land:max-w-none">{error}</p>}

        <SubmitButton tone="card" onClick={handleSubmit} disabled={busy}>
          {busy ? '正在寫入中...' : '確認標籤，完成登錄'}
        </SubmitButton>
      </FormPage>
    </div>

    {/* ======== 桌機（lg:）：照 2026-11 Figma「證件類遺失物登錄」CSS 的確認頁那張。
        CSS 標題寫的是「證件類遺失物登錄」、還多一顆返回鍵跟一顆單獨的「身份證」膠囊，
        應該是跟上一頁（RegisterIdPage）共用同一個畫框複製過來忘記清掉——這頁手機版
        標題是「確認標籤」、沒有返回鍵（FormHeader 沒給 onBack，同 inner page-11 設計），
        也沒有那顆獨立膠囊（標籤只在最下面的標籤卡顯示一次），照手機版做。 ======== */}
    <div className="hidden min-h-screen w-full flex-col items-center bg-paper lg:flex">
      <DesktopTopNav />

      <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-8 px-6 pb-16 pt-10 box-border">
        <h1 className="m-0 text-2xl font-normal text-[#2F1702]">確認標籤</h1>

        <div className="flex h-[300px] w-full items-center justify-center overflow-hidden rounded-lg border border-black bg-white">
          {item.image && <img src={item.image} alt="" className="h-full w-full object-contain" />}
        </div>

        <div className="flex h-[58px] w-full items-center rounded-full border border-black bg-white px-4">
          <CalendarIcon className="h-5 w-5 shrink-0 text-[#6B7280]" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="拾獲日期"
            className="h-6 w-full bg-transparent px-3 text-base text-[#1C1C13] outline-none"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex h-[58px] flex-1 items-center rounded-full border border-black bg-white px-4">
            <select
              value={city}
              onChange={(e) => { setCity(e.target.value); setDistrict('') }}
              aria-label="拾獲的縣市"
              className="h-6 w-full appearance-none bg-transparent text-base text-[#1C1C13] outline-none"
            >
              <option value="">選擇拾獲的縣市</option>
              {CITY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDownIcon className="pointer-events-none h-4 w-4 shrink-0 text-[#6B7280]" />
          </div>
          <div className="flex h-[58px] flex-1 items-center rounded-full border border-black bg-white px-4">
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={!city}
              aria-label="拾獲的地區"
              className="h-6 w-full appearance-none bg-transparent text-base text-[#1C1C13] outline-none"
            >
              <option value="">選擇拾獲的地區</option>
              {(TAIWAN_REGIONS[city] || []).map((d) => <option key={d} value={d}>{d}</option>)}
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
          className="flex h-[58px] w-full items-center rounded-full border border-black bg-white px-6 text-base text-[#1C1C13] outline-none placeholder:text-[#1C1C13]"
        />

        <input
          type="text"
          value={sendTo}
          onChange={(e) => setSendTo(e.target.value)}
          placeholder="送往的詳細地點（例如：文山二分局）"
          aria-label="送往的詳細地點"
          className="flex h-[58px] w-full items-center rounded-full border border-black bg-white px-6 text-base text-[#1C1C13] outline-none placeholder:text-[#1C1C13]"
        />

        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="備註（非必填）"
          className="h-[106px] w-full resize-none rounded-lg border border-black bg-white p-4 text-base text-[#1C1C13] outline-none placeholder:text-[#50453D]"
        />

        <div className="box-border w-full rounded-[10px] border border-black bg-card p-6">
          <div className="mb-3 text-xl font-semibold text-[#482B12]">{fixedTags || manualTags ? '標籤' : 'AI 標籤'}</div>
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <div key={tag} className="box-border inline-flex h-[50px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black bg-blue px-5 py-[10px] text-base font-normal text-[#482B12]">
                {tag}
                {!fixedTags && (
                  <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== tag))} aria-label={`移除 ${tag}`} className="ml-1 text-lg font-bold">×</button>
                )}
              </div>
            ))}
            {!fixedTags && (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="box-border inline-flex h-[50px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black bg-white px-5 py-[10px] text-base font-normal text-[#482B12]"
              >
                <PlusIcon className="h-[15px] w-[15px] shrink-0" />
                新增
              </button>
            )}
          </div>
        </div>

        {error && <p className="m-0 text-sm leading-normal text-error">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={busy}
          className="flex h-20 w-full items-center justify-center gap-3 rounded-full border-2 border-black bg-card text-xl text-[#1C1C13] transition hover:brightness-[.98] disabled:opacity-60"
        >
          <CircleCheckIcon className="h-10 w-10 shrink-0" />
          {busy ? '正在寫入中...' : '確認標籤，完成登錄'}
        </button>
      </div>

      <DesktopFooter />
    </div>

    {/* 非證件類才會開到（證件類沒有新增鈕）；fixed 置中彈窗，手機／桌機共用 */}
    {!fixedTags && (
      <TagPickerModal
        open={pickerOpen}
        value={tags}
        onClose={() => setPickerOpen(false)}
        onConfirm={setTags}
      />
    )}
    </>
  )
}
