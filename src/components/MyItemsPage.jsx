import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, CalendarIcon, MagnifyingGlassIcon } from './icons'
import { listMyItems } from '../lib/items'
import { useAuth } from '../context/AuthContext'
import { asset } from '../lib/asset'
import { LOST_STATUS } from '../data/itemStatus'
import { normalizeIdWording } from '../lib/text'

/**
 * 「我的遺失物／我的拾獲物」清單頁（inner page-15／page-18）。
 * 標頭 174px（標題 top:74、返回鍵 30×30 在 (21,69)），搜尋列併在標頭內（top:109、340 寬、間距 10），
 * 清單 340 寬、卡片間距 15，卡片 padding 10／gap 15／縮圖 100。
 */

// inner renderMyLostItems 的狀態文字顏色
function statusColor(status) {
  if (status === LOST_STATUS.FOUND) return '#2E7D32'
  if (status === LOST_STATUS.BROADCASTING || status === LOST_STATUS.POSTED) return '#B8860B'
  if (status === LOST_STATUS.BROADCAST_ENDED) return '#8C8C8C'
  return '#492C13'
}

function Thumb({ img }) {
  return (
    <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white">
      <img src={img || asset('/icons/logo2.png')} alt="" className={`h-full w-full ${img ? 'object-cover' : 'object-contain'}`} />
    </div>
  )
}

export default function MyItemsPage({ title, kind, detailBase, emptyText }) {
  // emptyText：inner「尚無符合條件的遺失物資料／拾獲物資料」，沒資料與篩選後沒結果都用同一句
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [query, setQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    listMyItems(kind, userId).then((list) => {
      if (alive) { setItems(list); setLoading(false) }
    })
    return () => { alive = false }
  }, [kind, userId])

  const filtered = useMemo(() => {
    // 搜尋範圍：inner 的日期／地點／備註／描述／標籤，加上 outter 的物品名、編號與拾獲物的送往地點；
    // 不分大小寫，「身份／身分」視為相同。日期同時比對 2026-09-29 與畫面上的 2026/09/29。
    const q = normalizeIdWording(query.trim().toLowerCase())
    return items.filter((it) => {
      const haystack = [
        it.name, it.id, it.date, (it.date || '').replaceAll('-', '/'),
        it.place, it.dropLocation, it.remark, it.desc, ...(it.tags || []),
      ].filter(Boolean).join(' ').toLowerCase()
      const okText = !q || normalizeIdWording(haystack).includes(q)
      const okDate = !dateFilter || it.date === dateFilter
      return okText && okDate
    })
  }, [items, query, dateFilter])

  // inner：載入中＝16px 棕色；空白提示＝16px 灰色（#888），padding 20、置中
  const note = 'p-5 text-center text-base leading-normal'

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col items-center bg-paper pb-[120px]">
      <header className="safe-header-bleed relative h-[174px] w-full shrink-0 rounded-b-[20px] bg-card">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute left-[21px] top-[69px] h-[30px] w-[30px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <ChevronLeftIcon className="h-[30px] w-[30px]" />
        </button>
        <h1 className="absolute left-0 top-[74px] w-full text-center text-xl font-bold leading-5 text-brown">{title}</h1>

        <div className="absolute left-1/2 top-[109px] flex w-full max-w-[340px] -translate-x-1/2 gap-[10px]">
          <label className="relative flex h-[47px] w-[97px] shrink-0 items-center justify-center rounded-[50px] border border-black bg-card">
            <CalendarIcon className="pointer-events-none h-5 w-5" />
            {dateFilter && <span className="pointer-events-none absolute right-[14px] top-2 h-2 w-2 rounded-full bg-error" />}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="依日期篩選"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
          <div className="box-border flex h-[45px] min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-black bg-input px-[15px] py-[10px]">
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋"
              className="h-[25px] w-full bg-transparent p-0 text-sm leading-[25px] text-brown outline-none placeholder:text-[#888]"
            />
          </div>
        </div>
      </header>

      <div className="mt-5 flex w-full max-w-[340px] flex-col gap-[15px]">
        {loading && <p className={`${note} text-brown`}>載入中...</p>}
        {!loading && filtered.length === 0 && <p className={`${note} text-[#888]`}>{emptyText}</p>}

        {filtered.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => navigate(`${detailBase}/${it.id}`, { state: { item: it } })}
            className="box-border flex w-full items-center gap-[15px] rounded-[10px] border border-black bg-card p-[10px] text-left text-brown
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            <Thumb img={it.image} />
            <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
              <div className="truncate text-xs font-bold">＃{String(it.id).toUpperCase()}</div>
              <div className="truncate text-sm font-bold">{it.name || (it.tags || []).map((t) => `#${t}`).join(' ')}</div>
              <div className="text-xs font-normal">{(it.date || '').replaceAll('-', '/')}</div>
              {it.status && (
                <div className="text-xs font-medium" style={{ color: statusColor(it.status) }}>{it.status}</div>
              )}
            </div>
            <ChevronLeftIcon className="h-5 w-5 shrink-0 -scale-x-100" />
          </button>
        ))}
      </div>
    </div>
  )
}
