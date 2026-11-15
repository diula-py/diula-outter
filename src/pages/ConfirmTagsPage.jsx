import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon, PlusIcon, CircleCheckIcon, ChevronDownIcon } from '../components/icons'
import { FormHeader, FormPage, FormCard, FormRow, RegionField, SubmitButton, pillInput } from '../components/FormKit'
import DesktopTopNav from '../components/DesktopTopNav'
import DesktopFooter from '../components/DesktopFooter'
import { CITY_ORDER, TAIWAN_REGIONS } from '../data/taiwanRegions'
import { asset } from '../lib/asset'
import TagPickerModal from '../components/TagPickerModal'
import { flask, apiFetch } from '../lib/api'
import { todayStr } from '../lib/date'
import { downscale } from '../lib/image'
import { addMyItem, updateMyItem } from '../lib/items'
import { useAuth } from '../context/AuthContext'
import { LOST_STATUS } from '../data/itemStatus'
import { titleFromTags } from '../data/tagTaxonomy'
import { useLeaveIfHandled } from '../lib/handledLost'
import { HttpError, friendlyError } from '../lib/errors'

export default function ConfirmTagsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userId } = useAuth()
  const data = location.state || {}

  const [date, setDate] = useState(data.date || todayStr())
  const [placeCity, setPlaceCity] = useState((data.place || '').split(' ')[0] || '')
  const [placeDistrict, setPlaceDistrict] = useState((data.place || '').split(' ')[1] || '')
  const [tags, setTags] = useState(data.tags || [])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // 這筆已發協尋文／開自動推播 → 退回來不能再比對一次（會再進結果頁選另一個），直接換成首頁
  const handled = useLeaveIfHandled(data.lostId)

  const place = [placeCity, placeDistrict].filter(Boolean).join(' ') // 遺失地點合併字串

  function removeTag(t) {
    setTags((prev) => prev.filter((x) => x !== t))
  }

  async function handleConfirm() {
    setError('')
    if (!date) { setError('請選擇遺失日期'); return }
    if (!placeCity || !placeDistrict) { setError('請選擇遺失的縣市與地區'); return }
    if (tags.length === 0) { setError('至少要有一個標籤才能比對'); return }
    setBusy(true)
    // 先存進「我的遺失物」再比對；已存過（重試、或從結果頁返回再按一次）就更新同一筆
    let lostId = data.lostId
    try {
      const fields = { name: titleFromTags(tags), date, place, tags }
      if (lostId) {
        await updateMyItem('lost', lostId, fields)
      } else {
        // 縮小一點，避免超過 Firestore 單筆 1MB 上限
        const image = data.base64Image ? await downscale(data.base64Image, 800, 0.8) : null
        const saved = await addMyItem('lost', userId, { ...fields, kind: 'lost', image, status: LOST_STATUS.SEARCHING })
        lostId = saved.id
        // 記進這一頁的 history state，從結果頁返回時還拿得到，不會重複新增
        navigate(location.pathname, { replace: true, state: { ...data, lostId } })
      }
    } catch (e) {
      setError(`儲存失敗：${friendlyError(e)}`)
      setBusy(false)
      return
    }
    try {
      const res = await apiFetch(flask('/match'), {
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
      // 429 = 被限流（後端 MATCH_PER_IP_HOURLY），後端訊息是中文、會照用
      if (!res.ok) throw new HttpError(res.status, json.error)
      // 從「近2日遺失物快速看」的「開啟自動尋找並推播」進來的：不給看比對結果頁，
      // 直接帶著 /match 的結果（resolved/results）進訂閱頁、讓它自動送出訂閱。
      if (data.autoSubscribe) {
        navigate('/search/subscribe', { state: { query: { date, place, tags }, base64Image: data.base64Image, lostId, ...json, autoSubmit: true } })
      } else {
        navigate('/search/results', { state: { query: { date, place, tags }, base64Image: data.base64Image, lostId, ...json } })
      }
    } catch (e) {
      setError(`比對失敗：${friendlyError(e)}`)
    } finally {
      setBusy(false)
    }
  }

  if (handled) return null
  // 直接開網址（書籤、分享連結）沒有上一頁帶來的資料 → 回跨平台尋找表單重新開始
  if (!location.state) return <Navigate to="/search" replace />

  return (
    <>
      {/* ======== 手機／手機橫放：維持原本版型，桌機（lg:）整個藏起來 ======== */}
      <div className="lg:hidden">
        <FormPage>
          {/* Header（cream，80px，僅標題、沒有返回鍵） */}
          <FormHeader title="確認標籤" />

          {/* 圖片模式：340×200；文字模式：米色卡片＋筆圖示＋描述（inner page-05） */}
          {data.mode === 'text' ? (
            <div className="mt-5 box-border flex w-[calc(100%-40px)] max-w-[340px] shrink-0 items-center gap-[15px] rounded-[10px] bg-card p-[15px]
                            land:col-start-1 land:mt-0 land:w-full land:max-w-none">
              <img src={asset('/icons/square-pen.png')} alt="" aria-hidden="true" className="h-10 w-10 shrink-0 object-contain" />
              <div className="min-w-0 flex-1 break-words text-sm font-normal leading-normal text-brown">{data.desc}</div>
            </div>
          ) : (
            <div className="mt-5 h-[200px] w-[calc(100%-40px)] max-w-[340px] shrink-0 overflow-hidden rounded-[10px]
                            land:col-start-1 land:mt-0 land:h-[150px] land:w-full land:max-w-none">
              {data.base64Image && <img src={data.base64Image} alt="" className="h-full w-full bg-input object-contain" />}
            </div>
          )}

          {/* 日期 / 地點 */}
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
          </FormCard>

          {/* 比對時間區間提示：跟後端 matcher 的 TIME_TOLERANCE(前5) / TIME_WINDOW_DAYS(後30) 一致，
              改一邊要同步改另一邊。放在日期卡正下方、橫式同在右欄。 */}
          <p className="mt-1 w-[calc(100%-40px)] max-w-[340px] text-xs leading-normal text-brown/70
                        land:col-start-2 land:mt-0 land:w-full land:max-w-none">
            系統會比對<b className="text-brown">遺失日前 5 天～後 30 天</b>內拾獲的失物
          </p>

          {/* AI 標籤（可增刪）：340 寬、padding 20、標題 16/600（同 inner）、chip 高 30 */}
          <div className="mt-5 box-border min-h-[98px] w-[calc(100%-40px)] max-w-[340px] shrink-0 rounded-[10px] bg-card p-5
                          land:col-start-2 land:mt-0 land:w-full land:max-w-none">
            <div className="mb-[10px] text-base font-semibold text-brown">AI 標籤</div>
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

          {error && <p className="mt-[15px] w-[calc(100%-40px)] max-w-[340px] text-sm leading-normal text-error">{error}</p>}

          <SubmitButton tone="card" onClick={handleConfirm} disabled={busy}>
            {busy ? '比對中…' : '確認！開始比對尋找'}
          </SubmitButton>
        </FormPage>
      </div>

      {/* ======== 桌機（lg:）：照 2026-11 Figma「確認標籤」CSS。跟 CrossSearchPage 一樣
          不動 FormKit，這支自己寫一套 768 置中欄桌機版，狀態邏輯整頁共用。
          CSS 裡標題文字是「尋找遺失物」，應該是 Figma 從搜尋表單那張複製忘記改——這頁
          功能是確認 AI 標籤，照手機版沿用「確認標籤」比較不會讓人誤會。 ======== */}
      <div className="relative hidden min-h-screen w-full flex-col items-center overflow-hidden bg-paper lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute left-0 top-[85px] h-64 w-64 rounded-full bg-[#FFDCC3]/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-[345px] right-0 h-80 w-80 rounded-full bg-[#D5E4F8]/30 blur-3xl" />

        <DesktopTopNav />

        <div className="z-10 mx-auto flex w-full max-w-[768px] flex-col gap-10 px-6 pb-16 pt-10 box-border">
          <h1 className="m-0 text-2xl font-normal text-[#2F1702]">確認標籤</h1>

          {data.mode === 'text' ? (
            <div className="min-h-[130px] w-full rounded-lg border border-black bg-white p-4">
              <div className="w-full break-words text-base font-normal leading-relaxed text-[#492C13]">{data.desc}</div>
            </div>
          ) : (
            <div className="flex h-[300px] w-full items-center justify-center overflow-hidden rounded-lg border border-black bg-white">
              {data.base64Image && <img src={data.base64Image} alt="" className="h-full w-full object-contain" />}
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex h-[58px] flex-1 items-center rounded-[10px] border border-black bg-white px-4">
              <select
                value={placeCity}
                onChange={(e) => { setPlaceCity(e.target.value); setPlaceDistrict('') }}
                aria-label="遺失的縣市"
                className="h-6 w-full appearance-none bg-transparent text-base text-brown outline-none"
              >
                <option value="">選擇縣市</option>
                {CITY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDownIcon className="pointer-events-none h-4 w-4 shrink-0 text-[#6B7280]" />
            </div>
            <div className="flex h-[58px] flex-1 items-center rounded-[10px] border border-black bg-white px-4">
              <select
                value={placeDistrict}
                onChange={(e) => setPlaceDistrict(e.target.value)}
                disabled={!placeCity}
                aria-label="遺失的地區"
                className="h-6 w-full appearance-none bg-transparent text-base text-brown outline-none"
              >
                <option value="">選擇地區</option>
                {(TAIWAN_REGIONS[placeCity] || []).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDownIcon className="pointer-events-none h-4 w-4 shrink-0 text-[#6B7280]" />
            </div>
          </div>

          <div className="flex h-[58px] w-full items-center rounded-[10px] border border-black bg-white px-4">
            <CalendarIcon className="h-5 w-5 shrink-0 text-[#6B7280]" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="遺失日期"
              className="h-6 w-full bg-transparent px-3 text-base text-brown outline-none"
            />
          </div>

          <p className="m-0 text-sm leading-normal text-brown/70">
            系統會比對<b className="text-brown">遺失日前 5 天～後 30 天</b>內拾獲的失物
          </p>

          <div className="box-border w-full rounded-[10px] border border-black bg-card p-6">
            <div className="mb-3 text-xl font-semibold text-[#482B12]">AI 標籤</div>
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <div key={tag} className="box-border inline-flex h-[50px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black bg-blue px-5 py-[10px] text-base font-normal text-[#482B12]">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} aria-label={`移除 ${tag}`} className="ml-1 text-lg font-bold">×</button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="box-border inline-flex h-[50px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black bg-white px-5 py-[10px] text-base font-normal text-[#482B12]"
              >
                <PlusIcon className="h-[15px] w-[15px] shrink-0" />
                新增
              </button>
            </div>
          </div>

          {error && <p className="m-0 text-sm leading-normal text-error">{error}</p>}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="flex h-20 w-full items-center justify-center gap-3 rounded-full border-2 border-black bg-card text-xl text-[#1C1C13] transition hover:brightness-[.98] disabled:opacity-60"
          >
            <CircleCheckIcon className="h-10 w-10 shrink-0" />
            {busy ? '比對中…' : '確認！開始比對尋找'}
          </button>
        </div>

        <DesktopFooter />
      </div>

      <TagPickerModal open={pickerOpen} value={tags} onClose={() => setPickerOpen(false)} onConfirm={setTags} />
    </>
  )
}
