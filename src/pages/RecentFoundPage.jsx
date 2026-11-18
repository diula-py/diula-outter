import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DetailHeader } from '../components/DetailKit'
import { ChevronLeftIcon, DiulaPinIcon, XmarkIcon } from '../components/icons'
import { Overlay } from '../components/DialogKit'
import DesktopTopNav from '../components/DesktopTopNav'
import DesktopFooter from '../components/DesktopFooter'
import OnceTip from '../components/OnceTip'
import { TIP_NOT_MINE } from '../lib/tours'
import { asset } from '../lib/asset'
import { flask, apiFetch, wakeFlask } from '../lib/api'
import { itemTitle } from '../lib/text'
import { friendlyError } from '../lib/errors'

const SOURCE_LABEL = { npa: '警政署', metro: '北捷', hsr: '高鐵', diula: 'DiuLa!' }
const fmtDate = (s) => (s ? String(s).slice(0, 10).replaceAll('-', '/') : '')

// 跟 ResultsPage 的 ResultThumb／ProfilePage 原本的 MatchThumb 同邏輯：
// image_ref 不是 https 網址（本機路徑、空字串、北捷高鐵一律沒有）就用預設圖。
function ItemThumb({ src, size = 100 }) {
  const [broken, setBroken] = useState(false)
  const ok = src && /^https?:\/\//.test(src) && !broken
  return (
    <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white" style={{ height: size, width: size }}>
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

// 「都沒有我的遺失物」浮現規則同 ResultsPage：捲到第 7 筆（第 7 張卡片進入畫面）才浮現，
// 往回捲到它上方就收起；這批（當頁）不到 7 筆（含沒有結果）時一進來就顯示。
const SHOW_AT = 7

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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [range, setRange] = useState(null)
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingItems, setLoadingItems] = useState(true)
  const [error, setError] = useState('')
  const [sosOpen, setSosOpen] = useState(false)

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

  // 2) 頁籤(頂層／次層)或頁碼一變就重打一次清單
  useEffect(() => {
    if (topId == null) return
    let alive = true
    setLoadingItems(true)
    const qs = new URLSearchParams({ top_category: topId, page })
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
        setTotalPages(json.total_pages || 1)
        setRange({ start: json.window_start, end: json.window_end })
        setError('')
      })
      .catch((e) => { if (alive) setError(friendlyError(e)) })
      .finally(() => { if (alive) setLoadingItems(false) })
    return () => { alive = false }
  }, [topId, subId, page])

  // 換分類（頂層／次層）要跳回第 1 頁，不然留著上次的頁碼可能超過新分類的總頁數。
  function selectTop(id) {
    setTopId(id)
    const firstSub = categories.find((c) => c.parent_id === id)
    setSubId(firstSub?.id ?? null)
    setPage(1)
  }

  function selectSub(id) {
    setSubId(id)
    setPage(1)
  }

  const loading = loadingCats || loadingItems
  const empty = !loading && !error && !items.length
  const note = 'p-5 text-center text-base leading-normal opacity-70'

  // 手機版／桌機版的清單容器各自一個 ref：同一時間只有一個斷點實際顯示
  // （另一個是 display:none，量到的尺寸是 0），checkOne() 用 offsetParent
  // 判斷哪個才是目前真的顯示的那個，兩邊共用同一條顯示規則（見 ResultsPage 同款做法）。
  const listRef = useRef(null)
  const desktopListRef = useRef(null)
  const [showNotMine, setShowNotMine] = useState(false)
  useEffect(() => {
    function checkOne(ref) {
      const el = ref.current
      if (!el || el.offsetParent === null) return null
      const card = el.children[SHOW_AT - 1]
      return items.length < SHOW_AT || !card || card.getBoundingClientRect().top < window.innerHeight
    }
    function check() {
      setShowNotMine(checkOne(listRef) ?? checkOne(desktopListRef) ?? false)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [items.length, loading])

  return (
    <>
    {/* ======== 手機／手機橫放：維持原本版型，桌機（lg:）整個藏起來 ======== */}
    {/* 沒有 AppLayout（無 TabBar）——跟 ResultsPage／MyItemsPage 同樣的理由：
        這是從尋找頁按鈕點進來的子頁，不是分頁本身，用返回鍵回去就好。 */}
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col items-center bg-paper pb-10 land:max-w-none lg:hidden">
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
              <TabPill key={c.id} label={c.name} active={c.id === subId} onClick={() => selectSub(c.id)} small />
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

      <div ref={listRef} className="mt-3 flex w-[calc(100%-44px)] max-w-[350px] flex-col gap-5">
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

      {/* 頁碼列：count 遠大於一頁顯示的筆數時才需要，只有 1 頁就不顯示（後端已經算好 total_pages）。
          數字本身一排橫向可滑動（頁數多時不擠成兩行），加左右箭頭快速翻頁，照使用者給的參考樣式。 */}
      {totalPages > 1 && (
        <div className="mt-5 flex w-[calc(100%-44px)] max-w-[350px] items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="上一頁"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-black bg-input
                       disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            <ChevronLeftIcon className="h-4 w-4 text-brown" />
          </button>

          <div className={`flex min-w-0 flex-1 items-center justify-center gap-3 overflow-x-auto ${scrollbarHidden}`}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`shrink-0 px-0.5 text-base
                            ${p === page ? 'font-bold text-brown underline underline-offset-4' : 'font-normal text-brown/50'}
                            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="下一頁"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-black bg-input
                       disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            <ChevronLeftIcon className="h-4 w-4 -scale-x-100 text-brown" />
          </button>
        </div>
      )}

    </div>

    {/* 都沒有我的遺失物：浮現規則同 ResultsPage 的「都沒有我的物品」——捲到第 7 筆
        才浮現、不到 7 筆一進來就顯示；往回捲到它上方就收起。固定貼在視窗底部
        （＋iOS 底部橫條安全區），隱藏時淡出並往下 10px、不能點也不能用 Tab 選到。 */}
    <div className="pointer-events-none fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-1/2 z-[90] flex w-[calc(100%-40px)] max-w-[350px] -translate-x-1/2 justify-center land:bottom-[calc(10px+env(safe-area-inset-bottom))] land:max-w-[708px] lg:hidden">
      <button
        type="button"
        onClick={() => setSosOpen(true)}
        data-tip="none-recent"
        aria-hidden={!showNotMine}
        tabIndex={showNotMine ? 0 : -1}
        className={`box-border flex h-[60px] w-full items-center justify-center rounded-[50px] border border-black bg-blue text-base font-medium leading-4 text-brown shadow-[0_4px_4px_rgba(0,0,0,0.25)]
                    transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                    ${showNotMine ? 'pointer-events-auto translate-y-0 opacity-100' : 'translate-y-[10px] opacity-0'}`}
      >
        都沒有我的遺失物！
      </button>
    </div>

    {/* ======== 桌機（lg:）：這頁沒有拿到 Figma 稿，排版照已經定案的桌機清單頁骨架做
        （DesktopTopNav＋1280 置中欄＋DesktopFooter，卡片樣式同 ResultsPage 桌機版）：
        頂層/次層分類頁籤橫向排、結果 2 欄卡片、分頁同手機版邏輯。狀態/資料
        （topCats/subCats/items/...）整頁共用，這裡只是另一套排版。 ======== */}
    <div className="hidden min-h-screen w-full flex-col items-center bg-paper lg:flex">
      <DesktopTopNav />

      <div className="flex w-full flex-1 flex-col items-center">
      <div className="mx-auto w-full max-w-[1280px] px-10 pb-10 pt-10 box-border">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} aria-label="返回" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center">
            <ChevronLeftIcon className="h-[30px] w-[30px] text-brown" />
          </button>
          <h1 className="m-0 text-2xl font-normal text-brown">近 2 日遺失物快速看</h1>
        </div>

        {/* 頂層分類頁籤 */}
        {!!topCats.length && (
          <div className="mt-8 flex flex-wrap gap-3">
            {topCats.map((c) => (
              <TabPill key={c.id} label={c.name} active={c.id === topId} onClick={() => selectTop(c.id)} />
            ))}
          </div>
        )}

        {/* 次層分類：選中頂層底下的細分類 */}
        {!!subCats.length && (
          <div className="mt-4 w-full rounded-[20px] bg-card px-4 py-3">
            <div className="flex flex-wrap gap-3">
              {subCats.map((c) => (
                <TabPill key={c.id} label={c.name} active={c.id === subId} onClick={() => selectSub(c.id)} small />
              ))}
            </div>
          </div>
        )}

        {/* 日期區間 + 篩選條件下的總筆數 */}
        {range && (
          <div className="mt-6 flex items-center justify-between text-sm text-brown">
            <span>{fmtDate(range.start)} ~{fmtDate(range.end)}</span>
            <span className="font-medium">共 {count} 筆</span>
          </div>
        )}

        {/* 結果清單：2 欄，卡片 160×160 縮圖＋文字＋chevron，同 ResultsPage 桌機版卡片樣式 */}
        <div ref={desktopListRef} className="mt-6 grid grid-cols-2 gap-6">
          {loading && <p className="col-span-2 py-10 text-center text-base opacity-70">載入中...</p>}
          {!loading && error && <p className="col-span-2 py-10 text-center text-base opacity-70">{error}</p>}

          {empty && (
            <div className="col-span-2 flex flex-col items-center gap-4 py-16">
              <DiulaPinIcon className="h-[72px] w-[33px] opacity-80" />
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-lg font-bold text-brown">目前無遺失物</p>
                <p className="text-sm font-medium text-brown">換個分類看看，或到「跨平台尋找遺失物」搜尋更多</p>
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
                className="box-border flex items-center gap-6 rounded-[10px] border border-black bg-[#F5F5F5] p-[30px] text-left text-brown transition hover:brightness-[.98]"
              >
                <ItemThumb src={it.image_ref} size={160} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="truncate text-xl text-brown">{itemTitle(it) || x.category_name || '拾獲物'}</div>
                  <div className="truncate text-sm font-normal text-brown/70">
                    {[SOURCE_LABEL[it.source], fmtDate(it.found_date)].filter(Boolean).join(' ')}
                  </div>
                </div>
                <ChevronLeftIcon className="h-5 w-5 shrink-0 -scale-x-100" />
              </button>
            )
          })}
        </div>

        {/* 頁碼列 */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="上一頁"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-black bg-input disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-4 w-4 text-brown" />
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-3 overflow-x-auto">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                  className={`shrink-0 px-0.5 text-base ${p === page ? 'font-bold text-brown underline underline-offset-4' : 'font-normal text-brown/50'}`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="下一頁"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-black bg-input disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-4 w-4 -scale-x-100 text-brown" />
            </button>
          </div>
        )}

      </div>
      </div>

      <DesktopFooter />
    </div>

    {/* 都沒有我的遺失物（桌機版）：浮現規則同手機版那顆——捲到第 7 筆才浮現、
        不到 7 筆一進來就顯示，貼在視窗底部置中，樣式跟 ResultsPage 桌機版同款膠囊。 */}
    <div className="pointer-events-none fixed bottom-10 left-1/2 z-[90] hidden w-full max-w-[1280px] -translate-x-1/2 justify-center px-10 box-border lg:flex">
      <button
        type="button"
        onClick={() => setSosOpen(true)}
        data-tip="none-recent"
        aria-hidden={!showNotMine}
        tabIndex={showNotMine ? 0 : -1}
        className={`box-border flex h-[70px] w-full max-w-[400px] items-center justify-center rounded-full border border-black bg-blue text-xl font-medium text-brown shadow-[0_4px_4px_rgba(0,0,0,0.25)]
                    transition duration-300 hover:brightness-[.98]
                    ${showNotMine ? 'pointer-events-auto translate-y-0 opacity-100' : 'translate-y-[10px] opacity-0'}`}
      >
        都沒有我的遺失物！
      </button>
    </div>

    {/* 小提示：第一次看到「都沒有我的遺失物！」按鈕（近 2 日快速看一次；換分類不再出現）。
        anchor="none-recent" 會自動挑手機版／桌機版兩個 data-tip="none-recent" 裡
        目前看得到的那個，不用放在某一個 lg: 區塊裡面。 */}
    <OnceTip name="tip_not_mine_recent" anchor="none-recent" show={showNotMine && !sosOpen}>{TIP_NOT_MINE}</OnceTip>

    {/* 「都沒有我的遺失物」選項彈窗，樣式照 ResultsPage 的同款彈窗（inner notfound-popup）。
        這頁沒有比對條件(query/resolved)可以帶 —— 不是從填協尋單進來的，所以：
        「開啟自動尋找並推播」導去 /search 從頭填（SubscribePage 沒有 category_id/date 會擋下），
        「幫你發Threads的協尋文」可以直接進 /search/sos（那頁欄位都能手動填，不強制帶入） */}
    {sosOpen && (
      <Overlay onClose={() => setSosOpen(false)}>
        <div role="dialog" aria-modal="true" aria-label="都沒有我的遺失物" className="relative box-border flex h-[380px] w-[calc(100vw-20px)] max-w-[305px] shrink-0 flex-col items-center rounded-[10px] bg-card pt-[49px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
          <button
            type="button"
            onClick={() => setSosOpen(false)}
            aria-label="關閉"
            className="absolute left-3 top-[14px] h-[35px] w-[35px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            <XmarkIcon className="h-[35px] w-[35px]" />
          </button>
          <div className="text-center text-2xl font-bold leading-6">都沒有我的遺失物！</div>
          <div className="mt-8 flex w-[254px] max-w-[calc(100%-40px)] flex-col gap-5">
            {[
              { label: '開啟自動尋找並推播', tone: 'bg-blue', go: () => navigate('/search', { state: { autoSubscribe: true } }) },
              { label: '幫你發Threads的協尋文', tone: 'bg-white', go: () => navigate('/search/sos') },
              { label: '返回首頁', tone: 'bg-white', go: () => navigate('/', { replace: true }) },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={b.go}
                className={`box-border flex h-[70px] items-center justify-center rounded-[50px] border border-black text-base font-medium leading-4 text-brown ${b.tone}
                            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </Overlay>
    )}
    </>
  )
}
