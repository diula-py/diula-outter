import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, DiulaPinIcon, XmarkIcon } from '../components/icons'
import { itemTitle } from '../lib/text'

const SOURCES = [
  { key: 'npa', label: '警政署' },
  { key: 'metro', label: '北捷' },
  { key: 'hsr', label: '高鐵' },
  { key: 'diula', label: 'DiuLa!' },
]

const fmtDate = (s) => (s ? String(s).slice(0, 10).replaceAll('-', '/') : '')

function ResultThumb({ src }) {
  const [broken, setBroken] = useState(false)
  const ok = src && /^https?:\/\//.test(src) && !broken
  return (
    <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-blue">
      {ok ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <DiulaPinIcon className="h-[52px] w-[52px] text-brown" />
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
  const [source, setSource] = useState(location.state?.source || firstWith?.key || 'npa')
  const [sosOpen, setSosOpen] = useState(false)

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

  return (
    <div>
      {/* Header */}
      <header className="flex h-20 items-center justify-center rounded-b-[20px] bg-card pt-[env(safe-area-inset-top)]">
        <h1 className="text-xl font-bold text-brown">比對結果</h1>
      </header>

      <div className="flex flex-col gap-5 px-[22px] pt-5">
        {/* 來源分頁 */}
        <div className="flex justify-between">
          {SOURCES.map((s) => {
            const active = source === s.key
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => selectSource(s.key)}
                className={`h-[45px] w-20 rounded-[50px] text-base text-brown transition
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                  ${active ? 'border-[1.5px] border-black bg-card font-medium' : 'border border-black bg-input font-normal'}`}
              >
                {s.label}
              </button>
            )
          })}
        </div>

        {/* 結果清單 */}
        {results.length === 0 && (
          <p className="py-10 text-center text-sm leading-normal text-brown/60">沒有比對資料（請從跨平台頁送出協尋單）</p>
        )}
        {results.length > 0 && list.length === 0 && (
          <p className="py-10 text-center text-sm leading-normal text-brown/60">此來源沒有相符的結果</p>
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
              className="flex items-center gap-[15px] rounded-[10px] border border-black bg-input p-5 text-left
                         transition hover:bg-[#efefef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <ResultThumb src={it.image_ref} />
              <div className="min-w-0 flex-1 text-brown">
                {lines.map((l, i) => (
                  <p key={i} className={i === 0 ? 'truncate text-base font-bold' : 'truncate text-xs text-brown/70'}>
                    {l}
                  </p>
                ))}
              </div>
              <ChevronLeftIcon className="h-5 w-5 shrink-0 -scale-x-100 text-brown" />
            </button>
          )
        })}
      </div>

      {/* 都沒有我的物品 FAB（浮在右下、TabBar 之上） */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[92px] z-20">
        <div className="mx-auto flex max-w-[393px] justify-end px-5">
          <button
            type="button"
            onClick={() => setSosOpen(true)}
            className="pointer-events-auto flex h-20 w-20 flex-col items-center justify-center rounded-full bg-blue
                       text-center text-base font-medium text-brown shadow-[0_4px_8px_rgba(0,0,0,0.25)]
                       transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            都沒有<br />我的物品
          </button>
        </div>
      </div>

      {/* 「都沒有我的東西」彈窗 */}
      {sosOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => setSosOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="都沒有我的東西"
            className="relative w-full max-w-[305px] rounded-[10px] bg-card px-6 pb-10 pt-14 shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSosOpen(false)}
              aria-label="關閉"
              className="absolute left-3 top-3 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <XmarkIcon className="h-[35px] w-[35px]" />
            </button>

            <p className="text-center text-2xl font-bold text-brown">都沒有我的東西！</p>

            <div className="mt-6 flex flex-col items-center gap-5">
              <button
                type="button"
                onClick={() => navigate('/search/subscribe', { state: location.state })}
                className="h-[70px] w-full rounded-[50px] border border-black bg-blue text-base font-medium text-brown
                           transition hover:brightness-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
              >
                開啟自動尋找並推播
              </button>
              <button
                type="button"
                onClick={() => navigate('/search/sos', { state: location.state })}
                className="h-[70px] w-full rounded-[50px] border border-black bg-white text-base font-medium text-brown
                           transition hover:bg-[#f4f4f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
              >
                幫你發Threads的協尋文
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="h-[70px] w-full rounded-[50px] border border-black bg-white text-base font-medium text-brown
                           transition hover:bg-[#f4f4f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
              >
                返回首頁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
