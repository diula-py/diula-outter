import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon, ChevronLeftIcon } from '../components/icons'
import { FormHeader } from '../components/FormKit'
import BackToTopButton from '../components/BackToTopButton'
import DesktopTopNav from '../components/DesktopTopNav'
import DesktopFooter from '../components/DesktopFooter'

import { fetchThreadsPosts, getCachedThreadsPosts } from '../lib/api'
import { normalizeIdWording } from '../lib/text'
import { asset } from '../lib/asset'
import { LoadingInline } from '../components/LoadingScreen'

/**
 * 貼文縮圖：載快照給的網址，不繞 Spring Boot /api/image 代理——那台在 Render 免費方案會休眠，
 * 冷啟動 ~50 秒，圖要等很久。
 * 2026-10-11 起圖是自家的：後端每天把貼文圖鏡像成 webp 縮圖放到 diula-web（GitHub Pages），
 * 快照的 image 直接指那裡，一張約 20KB、不會過期。原本直連 Instagram CDN 的簽章網址只活
 * 4 天多就回 403（實測 47 筆：4.3～4.5 天），舊貼文的照片必然消失。
 * 捲到才載（lazy）。沒有圖、或連自家圖也掛了 → 藍底驚嘆號 logo（同比對結果頁的預設圖）。
 */
function Thumb({ url, size = 100 }) {
  const [broken, setBroken] = useState(false)
  const showImg = url && !broken
  return (
    <div className="shrink-0 overflow-hidden rounded-[10px] bg-card" style={{ height: size, width: size }}>
      {showImg ? (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <img src={asset('/icons/logo2.png')} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  )
}

export default function ThreadsSearchPage() {
  const navigate = useNavigate()
  // 有上次的貼文就先用（從詳情返回時第一個畫面就是完整列表，捲動位置才還原得回去），背景再重讀
  const cached = getCachedThreadsPosts()
  const [posts, setPosts] = useState(cached || [])
  const [state, setState] = useState(cached ? 'ready' : 'loading') // loading | ready | error | offline
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    fetchThreadsPosts()
      .then((data) => { if (alive) { setPosts(Array.isArray(data) ? data : []); setState('ready') } })
      // 已經有上次的貼文在畫面上就不蓋掉，只有一開始就沒資料時才顯示錯誤
      .catch((e) => { if (alive) setState((s) => (s === 'ready' ? s : e?.offline ? 'offline' : 'error')) })
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const q = normalizeIdWording(query.trim())
    return posts.filter((p) => {
      const okText = !q || normalizeIdWording(String(p.text || '')).includes(q)
      return okText
    })
  }, [posts, query])

  return (
    <>
    {/* ======== 手機／手機橫放：維持原本版型，桌機（lg:）整個藏起來 ======== */}
    {/* 沒有 AppLayout（無 TabBar），外框與底部留白（含 iOS safe-area）自己處理；
        底部留 90px：滑到底時最後一張卡片不會被「回到頂部」圓鈕（離底 20、高 50）蓋住 */}
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col items-center bg-paper pb-[calc(90px+env(safe-area-inset-bottom))] land:max-w-none md:max-w-[700px] lg:hidden">
      <FormHeader title="Threads 尋找遺失物" onBack={() => navigate(-1)} />

      {/* 搜尋列（inner）：寬 calc(100% - 44px)、最大 340、高 46、圓角 10、padding 10 20、間距 10、icon 20×20 */}
      <div className="mt-5 box-border flex h-[46px] w-[calc(100%-44px)] max-w-[340px] shrink-0 items-center gap-[10px] rounded-[10px] border border-black bg-input px-5 py-[10px] land:mt-3 land:max-w-[708px] md:max-w-[708px]">
        <MagnifyingGlassIcon className="h-5 w-5 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋 Threads 協尋文"
          className="h-[26px] min-w-0 flex-1 bg-transparent p-0 text-sm font-normal leading-[26px] text-brown outline-none placeholder:text-[#888]"
        />
      </div>

      {/* 貼文清單：340 寬、卡片間距 15；卡片 padding 20、間距 15、文字 16/500 最多 3 行 */}
      <div className="mt-5 flex w-[calc(100%-40px)] max-w-[340px] flex-col gap-[15px]
                      land:mt-3 land:grid land:max-w-[708px] land:grid-cols-2 land:items-start land:gap-[14px]
                    md:grid md:max-w-[708px] md:grid-cols-2 md:items-start md:gap-[14px]">
        {state === 'loading' && <LoadingInline className="land:col-span-full md:col-span-full" />}
        {state === 'error' && <div className="py-5 text-center land:col-span-full md:col-span-full text-sm leading-normal text-error">載入失敗，請檢查網路後再試一次</div>}
        {state === 'offline' && <div className="py-5 text-center land:col-span-full md:col-span-full text-sm leading-normal text-error">目前離線，尚未儲存 Threads 貼文，請連上網路後再試一次</div>}
        {state === 'ready' && filtered.length === 0 && <div className="py-5 text-center land:col-span-full md:col-span-full text-base opacity-60">目前尚無 Threads 協尋文</div>}

        {state === 'ready' &&
          filtered.map((p) => (
            <Link
              key={p.id}
              to={`/search/threads/${p.id}`}
              state={{ post: p }}
              className="box-border flex w-full items-center gap-[15px] rounded-[10px] border border-black bg-input p-5 text-brown no-underline
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <Thumb url={p.image} />
              <div className="line-clamp-3 min-w-0 flex-1 text-base font-medium leading-normal">{p.text || '（無內文）'}</div>
            </Link>
          ))}
      </div>

      {/* 回到頂部：右下角、離底部 20px（這頁沒有底部膠囊） */}
      <BackToTopButton bottomClass="bottom-[calc(20px+env(safe-area-inset-bottom))]" />
    </div>

    {/* ======== 桌機（lg:）：照 2026-11 Figma「Threads尋找遺失物」CSS。這頁是列表頁，
        照同一套「接近全寬」版面（跟比對結果頁一樣），不是 768 置中窄欄。CSS 的卡片內容
        （組織／地點／日期）是比對結果頁那個元件複製過來的，Threads 貼文實際上只有圖＋
        一段文字，沒有那些結構化欄位，照手機版實際資料畫（圖＋內文），卡片外觀照抄新樣式。
        CSS 另外畫了一顆「選擇日期」篩選鈕，手機版完全沒有日期篩選功能、也沒有對應的
        state，照之前幾次的原則先不加——加了會是一個看起來能選但篩不出東西的假按鈕。 ======== */}
    <div className="hidden min-h-screen w-full flex-col items-center bg-paper lg:flex">
      <DesktopTopNav />

      <div className="flex w-full flex-1 flex-col items-center">
        <div className="mx-auto w-full max-w-[1280px] px-20 pb-16 pt-10 box-border">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate(-1)} aria-label="返回" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center">
              <ChevronLeftIcon className="h-[30px] w-[30px] text-brown" />
            </button>
            <h1 className="m-0 text-2xl font-normal text-brown">Threads 尋找遺失物</h1>
          </div>

          {/* 輸入框要矩形（跟手機版同一套規則：輸入框矩形、按鈕膠囊形），不是膠囊 */}
          <div className="mt-8 flex h-[74px] items-center gap-5 rounded-[10px] border border-[#2F1702] bg-[#F5F5F5] px-6">
            <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-brown" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋 Threads 協尋文"
              className="h-full min-w-0 flex-1 bg-transparent p-0 text-base text-brown outline-none placeholder:text-[#888]"
            />
          </div>

          <div className="mt-8 flex flex-col gap-5">
            {state === 'loading' && <LoadingInline />}
            {state === 'error' && <div className="py-5 text-center text-base leading-normal text-error">載入失敗，請檢查網路後再試一次</div>}
            {state === 'offline' && <div className="py-5 text-center text-base leading-normal text-error">目前離線，尚未儲存 Threads 貼文，請連上網路後再試一次</div>}
            {state === 'ready' && filtered.length === 0 && <div className="py-5 text-center text-lg opacity-60">目前尚無 Threads 協尋文</div>}

            {state === 'ready' &&
              filtered.map((p) => (
                <Link
                  key={p.id}
                  to={`/search/threads/${p.id}`}
                  state={{ post: p }}
                  className="box-border flex w-full items-center gap-6 rounded-xl border border-black bg-[#F5F5F5] p-4 text-brown no-underline shadow-sm transition hover:brightness-[.98]"
                >
                  <Thumb url={p.image} size={128} />
                  <div className="line-clamp-3 min-w-0 flex-1 text-lg leading-relaxed">{p.text || '（無內文）'}</div>
                  <ChevronLeftIcon className="h-5 w-5 shrink-0 -scale-x-100" />
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* 回到頂部（桌機）：右下角 */}
      <BackToTopButton bottomClass="bottom-10" widthClass="w-full max-w-[1280px] px-10" />

      <DesktopFooter />
    </div>
    </>
  )
}
