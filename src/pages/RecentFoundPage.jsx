import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DetailHeader } from '../components/DetailKit'
import { ChevronLeftIcon, DiulaPinIcon } from '../components/icons'
import { asset } from '../lib/asset'
import { flask, apiFetch, wakeFlask } from '../lib/api'
import { itemTitle } from '../lib/text'
import { friendlyError } from '../lib/errors'

const SOURCE_LABEL = { npa: '警政署', metro: '北捷', hsr: '高鐵', diula: 'DiuLa!' }
const fmtDate = (s) => (s ? String(s).slice(0, 10).replaceAll('-', '/') : '')

// 跟 ResultsPage 的 ResultThumb／ProfilePage 原本的 MatchThumb 同邏輯：
// image_ref 不是 https 網址（本機路徑、空字串、北捷高鐵一律沒有）就用預設圖。
function ItemThumb({ src }) {
  const [broken, setBroken] = useState(false)
  const ok = src && /^https?:\/\//.test(src) && !broken
  return (
    <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white">
      {ok
        ? <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
        : <img src={asset('/icons/logo2.png')} alt="" className="h-full w-full object-contain" />}
    </div>
  )
}

// 橫向可滑動的頁籤膠囊（頂層分類／次層分類共用同一個樣式規則）。
function TabPill({ label, active, onClick, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-[50px] px-[14px] text-brown
                  ${small ? 'h-10 text-sm' : 'h-[45px] text-base'}
                  ${active ? 'border-[1.5px] border-black bg-blue font-medium' : 'border border-black bg-input font-normal'}`}
    >
      {label}
    </button>
  )
}

const scrollbarHidden = '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

// 「近2日遺失物快速看」（2026-11 改版：分類頁籤 UI）。打 Flask 的 /items/recent
// （不用登入，公開瀏覽，見 diula-outter/flask_app.py），分類頁籤資料沿用既有的
// GET /categories（level==1 是頂層頁籤，level==2 是選中頁籤下的次層頁籤，跟
// src/data/tagTaxonomy.js 的 14 大類同一套、1:1 對應，id 直接拿來篩 Firestore）。
//
// 跟拿掉的 RecentLostQuickView 不一樣：那支是「我訂閱的協尋，即時重新比對」，
// 這支單純是「全站最近有什麼」，沒有相符 %，改顯示來源（警政署／北捷／高鐵／DiuLa!）。
//
// ⚠ 簡化：設計稿次層頁籤上方有個指向選中頂層頁籤的小三角形「對話泡泡」尖角。
// 頂層頁籤橫向可滑動，尖角要精準指到選中的那顆得抓該按鈕的 DOM 位置動態算，
// 這版先不做（兩排頁籤本身的功能都在，只是視覺上少了那個尖角），要再加再說。
export default function RecentFoundPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [topId, setTopId] = useState(null)
  const [subId, setSubId] = useState(null)
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [range, setRange] = useState(null)
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingItems, setLoadingItems] = useState(true)
  const [error, setError] = useState('')

  // 1) 先抓分類表，決定頁籤有哪些、預設選第一個頂層＋它底下第一個次層
  useEffect(() => {
    let alive = true
    wakeFlask()
    apiFetch(flask('/categories'))
      .then(async (res) => {
        const json = await res.json().catch(() => [])
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return json
      })
      .then((cats) => {
        if (!alive) return
        setCategories(cats)
        const firstTop = cats.find((c) => c.level === 1)
        setTopId(firstTop?.id ?? null)
        const firstSub = firstTop && cats.find((c) => c.parent_id === firstTop.id)
        setSubId(firstSub?.id ?? null)
      })
      .catch((e) => { if (alive) setError(friendlyError(e)) })
      .finally(() => { if (alive) setLoadingCats(false) })
    return () => { alive = false }
  }, [])

  const topCats = useMemo(() => categories.filter((c) => c.level === 1), [categories])
  const subCats = useMemo(() => categories.filter((c) => c.parent_id === topId), [categories, topId])

  // 2) 頁籤(頂層／次層)一變就重打一次清單
  useEffect(() => {
    if (topId == null) return
    let alive = true
    setLoadingItems(true)
    const qs = new URLSearchParams({ top_category: topId })
    if (subId != null) qs.set('category_id', subId)
    apiFetch(flask(`/items/recent?${qs}`))
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
        return json
      })
      .then((json) => {
        if (!alive) return
        setItems(json.items || [])
        setCount(json.count || 0)
        setRange({ start: json.window_start, end: json.window_end })
        setError('')
      })
      .catch((e) => { if (alive) setError(friendlyError(e)) })
      .finally(() => { if (alive) setLoadingItems(false) })
    return () => { alive = false }
  }, [topId, subId])

  function selectTop(id) {
    setTopId(id)
    const firstSub = categories.find((c) => c.parent_id === id)
    setSubId(firstSub?.id ?? null)
  }

  const loading = loadingCats || loadingItems
  const empty = !loading && !error && !items.length
  const note = 'p-5 text-center text-base leading-normal opacity-70'

  return (
    // 沒有 AppLayout（無 TabBar）——跟 ResultsPage／MyItemsPage 同樣的理由：
    // 這是從尋找頁按鈕點進來的子頁，不是分頁本身，用返回鍵回去就好。
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col items-center bg-paper pb-10 land:max-w-none">
      <DetailHeader title="近 2 日遺失物快速看" onBack={() => navigate(-1)} height={80} titleTop={40} backLeft={22} backTop={35} backSize={30} />

      {/* 頂層分類頁籤：橫向可滑動（跟 src/data/tagTaxonomy.js 的 14 大類一一對應） */}
      {!!topCats.length && (
        <div className={`mt-5 flex w-full gap-[10px] overflow-x-auto px-[22px] ${scrollbarHidden}`}>
          {topCats.map((c) => (
            <TabPill key={c.id} label={c.name} active={c.id === topId} onClick={() => selectTop(c.id)} />
          ))}
        </div>
      )}

      {/* 次層分類：選中頂層底下的細分類，一樣橫向可滑動 */}
      {!!subCats.length && (
        <div className="mt-3 w-[calc(100%-44px)] max-w-[350px] rounded-[20px] bg-card px-3 py-2">
          <div className={`flex gap-[10px] overflow-x-auto ${scrollbarHidden}`}>
            {subCats.map((c) => (
              <TabPill key={c.id} label={c.name} active={c.id === subId} onClick={() => setSubId(c.id)} small />
            ))}
          </div>
        </div>
      )}

      {/* 日期區間 + 篩選條件下的總筆數（不是只有顯示的這幾筆，見後端 count 欄位說明） */}
      {range && (
        <div className="mt-5 flex w-[calc(100%-44px)] max-w-[350px] items-center justify-between text-xs text-brown">
          <span>{fmtDate(range.start)} ~{fmtDate(range.end)}</span>
          <span className="font-medium">共 {count} 筆</span>
        </div>
      )}

      <div className="mt-3 flex w-[calc(100%-44px)] max-w-[350px] flex-col gap-5">
        {loading && <p className={note}>載入中...</p>}
        {!loading && error && <p className={note}>{error}</p>}

        {empty && (
          <div className="flex flex-col items-center gap-4 py-10">
            <DiulaPinIcon className="h-[72px] w-[33px] opacity-80" />
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-base font-bold text-brown">目前無遺失物</p>
              <p className="text-xs font-medium text-brown">換個分類看看，或到「跨平台尋找遺失物」搜尋更多</p>
            </div>
          </div>
        )}

        {items.map((x) => {
          const it = x.item || {}
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => navigate(`/search/results/${x.id}`, { state: { item: it } })}
              className="flex h-[150px] w-full items-center gap-[10px] rounded-[10px] border border-black bg-input p-[10px] text-left text-brown
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <ItemThumb src={it.image_ref} />
              <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
                <div className="truncate text-base font-medium leading-[150%]">{itemTitle(it) || x.category_name || '拾獲物'}</div>
                <div className="truncate text-xs leading-[150%] opacity-80">
                  {[SOURCE_LABEL[it.source], fmtDate(it.found_date)].filter(Boolean).join(' ')}
                </div>
              </div>
              <ChevronLeftIcon className="h-5 w-5 shrink-0 -scale-x-100 opacity-60" />
            </button>
          )
        })}
      </div>

      {/* 這批(頂層+次層篩選)完全沒有東西時，才出現的引導 CTA */}
      {empty && (
        <button
          type="button"
          onClick={() => navigate('/search')}
          className="mt-8 flex h-[60px] w-[calc(100%-44px)] max-w-[350px] items-center justify-center rounded-[50px] border border-black bg-blue text-base font-medium text-brown
                     transition hover:brightness-95 active:scale-[.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          都沒有我的遺失物！
        </button>
      )}
    </div>
  )
}
