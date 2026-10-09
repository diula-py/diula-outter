import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDownIcon, ChevronLeftIcon, HouseIcon } from '../components/icons'
import { Overlay, WireDialog, DialogTitle, DialogButton } from '../components/DialogKit'
import { XmarkIcon } from '../components/icons'
import { itemTitle } from '../lib/text'
import { asset } from '../lib/asset'
import { useLeaveIfHandled } from '../lib/handledLost'

const SOURCES = [
  { key: 'npa', label: '警政署' },
  { key: 'metro', label: '北捷' },
  { key: 'hsr', label: '高鐵' },
  { key: 'diula', label: 'DiuLa!' },
]

// 「都沒有我的物品」膠囊：滑到第 7 筆（第 7 張卡片進入畫面）才浮現，往回滑到它上方就收起；
// 這個分頁不到 7 筆（含沒有結果）時一進來就顯示。換分頁重新判斷。
const SHOW_AT = 7

const fmtDate = (s) => (s ? String(s).slice(0, 10).replaceAll('-', '/') : '')

// 沒有圖（北捷／高鐵一律沒有；警政署、DiuLa! 部分沒有）或圖載入失敗 → 藍底驚嘆號 logo（同我的遺失物列表的預設圖）
function ResultThumb({ src }) {
  const [broken, setBroken] = useState(false)
  const ok = src && /^https?:\/\//.test(src) && !broken
  return (
    <div className="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-[10px] bg-card">
      {ok ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <img src={asset('/icons/logo2.png')} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  )
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const results = location.state?.results || []

  // 預設選第一個「有結果」的來源；若之前選過（存在 history state）則沿用，
  // 這樣點進詳情再返回時不會跳回預設分頁。
  const firstWith = SOURCES.find((s) => results.some((r) => r.item?.source === s.key))
  const [source, setSource] = useState(location.state?.source || firstWith?.key || 'diula')
  // 這筆已發協尋文／開自動推播（只能擇一）→ 退回來也不顯示，直接換成首頁
  const handled = useLeaveIfHandled(location.state?.lostId)
  const [sosOpen, setSosOpen] = useState(false)
  const [homeConfirm, setHomeConfirm] = useState(false)

  // 切換分頁：記進當前 history entry 的 state（保留 results），返回時還原。
  function selectSource(key) {
    setSource(key)
    navigate(location.pathname + location.search, {
      replace: true,
      state: { ...location.state, source: key },
    })
  }

  const list = useMemo(
    () => results.filter((r) => r.item?.source === source),
    [results, source],
  )

  const listRef = useRef(null)
  const [showNotMine, setShowNotMine] = useState(false)
  useEffect(() => {
    function check() {
      const card = listRef.current?.children[SHOW_AT - 1]
      setShowNotMine(list.length < SHOW_AT || !card || card.getBoundingClientRect().top < window.innerHeight)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [source, list.length])

  // 「回到頂部」圓鈕：往下滑超過一個螢幕高才出現，回到一個螢幕高以內就收起
  const [showToTop, setShowToTop] = useState(false)
  useEffect(() => {
    function check() {
      setShowToTop(window.scrollY > window.innerHeight)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  const emptyBox =
    'box-border w-full rounded-[10px] border border-black bg-input px-5 py-[30px] text-center text-sm font-medium leading-normal opacity-70'

  if (handled) return null

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col items-center bg-paper pb-[calc(100px+env(safe-area-inset-bottom))]">
      {/* Header 80px：標題＋右上角「回首頁」（先跳確認彈窗）；沒有返回鍵（inner page-06） */}
      <header className="safe-header relative z-10 w-full shrink-0 rounded-b-[20px] bg-card [--header-h:80px]">
        <div className="relative flex h-full items-center justify-center">
          <h1 className="text-xl font-bold text-brown">比對結果</h1>
          <button
            type="button"
            onClick={() => setHomeConfirm(true)}
            aria-label="回首頁"
            className="back-hit absolute right-[22px] top-1/2 h-[30px] w-[30px] -translate-y-1/2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            <HouseIcon className="h-[30px] w-[30px]" />
          </button>
        </div>
      </header>

      {/* 來源分頁：4 顆 80×45、間距 10、置中；DiuLa! 那顆用最大 54×24 的 logo 圖。
          窄螢幕（放不下 350）4 顆平均縮小，文字仍置中 */}
      <div className="mt-5 flex w-[calc(100%-40px)] max-w-[350px] shrink-0 justify-center gap-[10px]">
        {SOURCES.map((s) => {
          const active = source === s.key
          const isDiula = s.key === 'diula'
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => selectSource(s.key)}
              aria-pressed={active}
              aria-label={s.label}
              className={`box-border flex h-[45px] w-20 min-w-0 items-center justify-center rounded-[50px] text-base text-black
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                ${isDiula ? 'px-[6px] py-1' : 'py-2'}
                ${active ? 'border-[1.5px] border-black bg-card font-bold' : 'border border-black bg-input font-normal'}`}
            >
              {isDiula ? (
                <img src={asset('/icons/diula-logo-cropped.png')} alt="" aria-hidden="true" className="h-6 w-full max-w-[54px] object-contain" />
              ) : (
                s.label
              )}
            </button>
          )
        })}
      </div>

      {/* 結果清單：340 寬、卡片間距 20 */}
      <div ref={listRef} className="mt-5 flex w-[calc(100%-40px)] max-w-[340px] flex-col gap-5">
        {results.length === 0 && <div className={emptyBox}>沒有比對資料（請從跨平台頁送出協尋單）</div>}
        {results.length > 0 && list.length === 0 && (
          <div className={emptyBox}>
            {source === 'diula' ? (
              <>
                目前站內尚無符合標籤的拾獲物，
                <br />
                DiuLa! 會持續為您比對。
                <br />
                您也可以點擊下方「都沒有我的物品」
                <br />
                開啟自動推播或發佈協尋文。
              </>
            ) : (
              '此來源沒有相符的結果'
            )}
          </div>
        )}

        {list.map((r) => {
          const it = r.item || {}
          const lines = [
            // 品名（粗體首行）：警政署去掉「拾得人拾獲：…請失主」樣板；北捷 description 為 null 時退回 free_tags[0]
            itemTitle(it),
            [it.city, it.district].filter(Boolean).join(''),
            it.holding_place || it.station,
            fmtDate(it.found_date),
          ].filter(Boolean)
          return (
            <button
              key={it.external_id || r.id}
              type="button"
              onClick={() => navigate(`/search/results/${it.external_id || r.id}`, { state: { item: it } })}
              className="box-border flex w-full items-center gap-[15px] rounded-[10px] border border-black bg-input p-5 text-left text-brown
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <ResultThumb src={it.image_ref} />
              <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                {lines.map((l, i) => (
                  <div key={i} className={i === 0 ? 'truncate text-base font-bold' : 'truncate text-xs font-normal opacity-70'}>
                    {l}
                  </div>
                ))}
              </div>
              <ChevronLeftIcon className="h-5 w-5 shrink-0 -scale-x-100" />
            </button>
          )
        })}
      </div>

      {/* 回到頂部：白底圓鈕 50×50、黑框、陰影，右緣對齊卡片欄，在「都沒有我的物品」膠囊上方 15px */}
      <div className="pointer-events-none fixed bottom-[calc(95px+env(safe-area-inset-bottom))] left-1/2 z-[90] flex w-[calc(100%-40px)] max-w-[340px] -translate-x-1/2 justify-end">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="回到頂部"
          aria-hidden={!showToTop}
          tabIndex={showToTop ? 0 : -1}
          className={`box-border flex h-[50px] w-[50px] items-center justify-center rounded-full border border-black bg-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]
                      transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                      ${showToTop ? 'pointer-events-auto translate-y-0 opacity-100' : 'translate-y-[10px] opacity-0'}`}
        >
          <ChevronDownIcon className="h-6 w-6 rotate-180" />
        </button>
      </div>

      {/* 都沒有我的物品：藍底膠囊 350×60（同其他主要膠囊）、陰影，浮在離視窗底部 20px（＋iOS 底部橫條安全區）。
          隱藏時淡出並往下 10px、不能點也不能用 Tab 選到；頁面底部留 100px，滑到底最後一張卡片不會被蓋住 */}
      <div className="pointer-events-none fixed bottom-[calc(20px+env(safe-area-inset-bottom))] left-1/2 z-[90] flex w-[calc(100%-40px)] max-w-[350px] -translate-x-1/2 justify-center">
        <button
          type="button"
          onClick={() => setSosOpen(true)}
          aria-hidden={!showNotMine}
          tabIndex={showNotMine ? 0 : -1}
          className={`box-border flex h-[60px] w-full items-center justify-center rounded-[50px] border border-black bg-blue text-base font-medium leading-4 text-brown shadow-[0_4px_4px_rgba(0,0,0,0.25)]
                      transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                      ${showNotMine ? 'pointer-events-auto translate-y-0 opacity-100' : 'translate-y-[10px] opacity-0'}`}
        >
          都沒有我的物品
        </button>
      </div>

      {/* 「都沒有我的物品」選項彈窗（照 Figma：305×380、陰影、X 35×35 在 (12,14)、
          標題 24/700 離頂端 49、按鈕 254×70 間距 20、第一顆離頂端 105、底部留 25） */}
      {sosOpen && (
        <Overlay onClose={() => setSosOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="都沒有我的物品" className="relative box-border flex h-[380px] w-[calc(100vw-20px)] max-w-[305px] flex-col items-center rounded-[10px] bg-card pt-[49px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
            <button
              type="button"
              onClick={() => setSosOpen(false)}
              aria-label="關閉"
              className="absolute left-3 top-[14px] h-[35px] w-[35px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <XmarkIcon className="h-[35px] w-[35px]" />
            </button>
            <div className="text-center text-2xl font-bold leading-6">都沒有我的物品！</div>
            <div className="mt-8 flex w-[254px] max-w-[calc(100%-40px)] flex-col gap-5">
              {[
                { label: '開啟自動尋找並推播', tone: 'bg-blue', go: () => navigate('/search/subscribe', { state: location.state }) },
                { label: '幫我在Threads發協尋文', tone: 'bg-white', go: () => navigate('/search/sos', { state: location.state }) },
                { label: '返回首頁', tone: 'bg-white', go: () => { setSosOpen(false); setHomeConfirm(true) } },
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

      {/* 確認是否回首頁（inner notfound-home-confirm：300×251） */}
      {homeConfirm && (
        <WireDialog height={251} onClose={() => setHomeConfirm(false)} label="確認要返回首頁">
          <DialogTitle top={85} width={200}>是否確認要返回首頁？</DialogTitle>
          <div className="absolute left-1/2 top-[116px] w-[228px] -translate-x-1/2 text-center text-xs font-normal leading-3 opacity-70">
            提醒：返回首頁後此次比對結果將無法返回
          </div>
          <DialogButton left={41} top={146} width={90} onClick={() => navigate("/")}>是</DialogButton>
          <DialogButton left={170} top={146} width={90} tone="blue" onClick={() => setHomeConfirm(false)}>否</DialogButton>
        </WireDialog>
      )}
    </div>
  )
}
