import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeftIcon } from '../components/icons'
import { Overlay, WireDialog, DialogTitle, DialogButton } from '../components/DialogKit'
import { XmarkIcon } from '../components/icons'
import { itemTitle } from '../lib/text'
import { asset } from '../lib/asset'

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
    <div className="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-[10px] bg-card">
      {ok && <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />}
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

  const emptyBox =
    'box-border w-full rounded-[10px] border border-black bg-input px-5 py-[30px] text-center text-sm font-medium leading-normal opacity-70'

  return (
    <div className="flex flex-col items-center pb-[120px]">
      {/* Header 80px：只有標題、沒有返回鍵（inner page-06） */}
      <header className="relative z-10 flex h-[80px] w-full shrink-0 items-center justify-center rounded-b-[20px] bg-card pt-[env(safe-area-inset-top)]">
        <h1 className="text-xl font-bold text-brown">比對結果</h1>
      </header>

      {/* 來源分頁：4 顆 80×45、間距 10、置中；DiuLa! 那顆用 68×37 的 logo 圖 */}
      <div className="mt-5 flex shrink-0 gap-[10px]">
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
              className={`box-border flex h-[45px] w-20 items-center justify-center rounded-[50px] text-base text-black
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                ${isDiula ? 'px-[6px] py-1' : 'px-[14px] py-2'}
                ${active ? 'border-[1.5px] border-black bg-card' : 'border border-black bg-input font-normal'}`}
            >
              {isDiula ? (
                <img src={asset('/icons/diula-logo-cropped.png')} alt="" aria-hidden="true" className="h-[37px] w-[68px] shrink-0 object-contain" />
              ) : (
                s.label
              )}
            </button>
          )
        })}
      </div>

      {/* 結果清單：340 寬、卡片間距 20 */}
      <div className="mt-5 flex w-full max-w-[340px] flex-col gap-5">
        {results.length === 0 && <div className={emptyBox}>沒有比對資料（請從跨平台頁送出協尋單）</div>}
        {results.length > 0 && list.length === 0 && (
          <div className={emptyBox}>
            {source === 'diula'
              ? '目前站內尚無符合標籤的拾獲物，DiuLa! 會持續為您比對。您也可以點擊右下角「都沒有我的物品」開啟自動推播或發佈協尋文。'
              : '此來源沒有相符的結果'}
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

      {/* 都沒有我的物品：80×80 藍色圓鈕，固定在視窗底部 145px、右緣對齊 340 欄（inner） */}
      <div className="pointer-events-none fixed bottom-[145px] left-1/2 z-[90] flex w-[340px] -translate-x-1/2 justify-end">
        <button
          type="button"
          onClick={() => setSosOpen(true)}
          className="pointer-events-auto flex h-20 w-20 shrink-0 items-center justify-center rounded-[40px] bg-blue text-center text-base font-medium leading-4 text-brown shadow-[0_4px_8px_rgba(0,0,0,0.25)]
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          都沒有<br />我的物品
        </button>
      </div>

      {/* 「都沒有我的東西」選項彈窗（inner notfound-modal：寬 300、padding 30 20、X 30×30、按鈕間距 12） */}
      {sosOpen && (
        <Overlay onClose={() => setSosOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="都沒有我的東西" className="relative box-border w-[300px] rounded-[10px] bg-card px-5 py-[30px]">
            <button
              type="button"
              onClick={() => setSosOpen(false)}
              aria-label="關閉"
              className="absolute left-[11px] top-[10px] h-[30px] w-[30px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <XmarkIcon className="h-[30px] w-[30px]" />
            </button>
            <div className="mb-5 mt-[25px] text-center text-xl font-bold">都沒有我的東西！</div>
            <div className="flex flex-col gap-3">
              {[
                { label: '開啟自動尋找並推播', tone: 'bg-blue', go: () => navigate('/search/subscribe', { state: location.state }) },
                { label: '幫我在Threads發協尋文', tone: 'bg-white', go: () => navigate('/search/sos', { state: location.state }) },
                { label: '返回首頁', tone: 'bg-white', go: () => { setSosOpen(false); setHomeConfirm(true) } },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  onClick={b.go}
                  className={`box-border flex items-center justify-center rounded-[50px] border border-black p-[15px] text-base font-medium text-brown ${b.tone}
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
          <DialogTitle top={85} width={200} lineHeight={26}>是否確認要返回首頁？</DialogTitle>
          <div className="absolute left-1/2 top-[116px] w-[228px] -translate-x-1/2 text-center text-xs font-normal leading-3 opacity-70">
            提醒：返回首頁後此次比對結果將無法返回
          </div>
          <DialogButton left={41} top={146} width={92} height={62} onClick={() => navigate("/")}>是</DialogButton>
          <DialogButton left={170} top={146} width={92} height={62} tone="blue" onClick={() => setHomeConfirm(false)}>否</DialogButton>
        </WireDialog>
      )}
    </div>
  )
}
