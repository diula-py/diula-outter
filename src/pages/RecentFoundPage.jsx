import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DetailHeader } from '../components/DetailKit'
import { ChevronLeftIcon } from '../components/icons'
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
    <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white">
      {ok
        ? <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
        : <img src={asset('/icons/logo2.png')} alt="" className="h-full w-full object-contain" />}
    </div>
  )
}

// 「近2日遺失物快速看」（2026-11 改版）：全站最近 2 天內拾獲的物品，不分使用者、
// 不比對——打 Flask 的 /items/recent（不用登入，公開瀏覽，見 diula-outter/flask_app.py）。
// 跟拿掉的 RecentLostQuickView 不一樣：那支是「我訂閱的協尋，即時重新比對」，這支單純
// 是「全站最近有什麼」，所以沒有「相符 %」，改顯示來源（警政署／北捷／高鐵／DiuLa!）。
export default function RecentFoundPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    wakeFlask()
    apiFetch(flask('/items/recent'))
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
        return json
      })
      .then((json) => { if (alive) { setItems(json.items || []); setError('') } })
      .catch((e) => { if (alive) setError(friendlyError(e)) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const note = 'p-5 text-center text-base leading-normal opacity-70'

  return (
    // 沒有 AppLayout（無 TabBar）——跟 ResultsPage／MyItemsPage 同樣的理由：
    // 這是從尋找頁按鈕點進來的子頁，不是分頁本身，用返回鍵回去就好。
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col items-center bg-paper pb-10 land:max-w-none">
      <DetailHeader title="近2日遺失物快速看" onBack={() => navigate(-1)} height={90} titleTop={55} backLeft={20} backTop={50} backSize={30} />

      <div className="mt-5 flex w-full max-w-[350px] flex-col gap-3 px-5">
        {loading && <p className={note}>載入中...</p>}
        {!loading && error && <p className={note}>{error}</p>}
        {!loading && !error && !items.length && <p className={note}>最近 2 天沒有新的拾獲物</p>}
        {items.map((x) => {
          const it = x.item || {}
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => navigate(`/search/results/${x.id}`, { state: { item: it } })}
              className="flex w-full items-center gap-3 rounded-[10px] border border-black bg-card p-3 text-left text-brown
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <ItemThumb src={it.image_ref} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
                <div className="truncate text-sm font-bold">{itemTitle(it) || x.category_name || '拾獲物'}</div>
                <div className="flex items-center gap-2 text-xs opacity-70">
                  <span>{[it.city, it.district].filter(Boolean).join('') || it.station || '—'}</span>
                  <span>{fmtDate(it.found_date)}</span>
                  {SOURCE_LABEL[it.source] && <span>{SOURCE_LABEL[it.source]}</span>}
                </div>
              </div>
              <ChevronLeftIcon className="h-4 w-4 shrink-0 -scale-x-100 opacity-60" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
