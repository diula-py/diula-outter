import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  DiulaPinIcon,
} from '../components/icons'
import { loadItems } from '../lib/myItems'

/** 無照片時的 DiuLa「!」pin 佔位（淺藍底）。 */
function ItemThumb({ img }) {
  return (
    <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-blue">
      {img ? (
        <img src={img} alt="" className="h-full w-full object-cover" />
      ) : (
        <DiulaPinIcon className="h-[52px] w-[52px] text-brown" />
      )}
    </div>
  )
}

export default function MyFoundPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [items] = useState(() => loadItems().filter((it) => it.kind === 'found')) // 進頁時讀本機拾獲紀錄

  const filtered = useMemo(() => {
    const q = query.trim()
    return items.filter((it) => {
      const okText = !q || (it.name || '').includes(q) || (it.code || '').includes(q)
      const okDate = !dateFilter || it.date === dateFilter
      return okText && okDate
    })
  }, [items, query, dateFilter])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-base pb-10">
      {/* Header（cream，109px，標題靠下） */}
      <header className="relative flex h-[109px] items-end justify-center rounded-b-[20px] bg-card pb-4 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute bottom-4 left-[26px] p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <ChevronLeftIcon className="h-[26px] w-[26px] text-brown" />
        </button>
        <h1 className="text-xl font-bold text-brown">我的拾獲物</h1>
      </header>

      <div className="flex flex-col gap-5 px-[22px] pt-5">
        {/* 篩選列：日期 + 搜尋 */}
        <div className="flex gap-3">
          <label className="relative flex h-[45px] w-[95px] shrink-0 items-center justify-center gap-2 rounded-[50px] border border-black bg-card">
            <CalendarIcon className="h-[26px] w-[26px] text-brown" />
            <ChevronDownIcon className="h-4 w-4 text-brown" />
            {dateFilter && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-error" />}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="依日期篩選"
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>

          <div className="flex h-[45px] min-w-0 flex-1 items-center gap-2.5 rounded-[50px] border border-black bg-input px-4">
            <MagnifyingGlassIcon className="h-[22px] w-[22px] shrink-0 text-brown" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋"
              className="min-w-0 flex-1 bg-transparent text-base text-brown outline-none placeholder:text-brown/70"
            />
          </div>
        </div>

        {/* 清單 */}
        {items.length === 0 && (
          <p className="py-10 text-center text-sm text-brown/60">
            還沒有拾獲物紀錄。<br />去「登錄拾獲物」登錄你撿到的東西吧！
          </p>
        )}
        {items.length > 0 && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-brown/60">沒有符合的項目</p>
        )}

        {filtered.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => navigate(`/my/found/${it.id}`, { state: { item: it } })}
            className="flex items-center gap-5 rounded-[10px] border border-black bg-input p-[25px] text-left
                       transition hover:bg-[#efefef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            <ItemThumb img={it.image} />
            <div className="min-w-0 flex-1 text-sm leading-relaxed text-brown">
              <p className="truncate">{it.code}</p>
              <p className="truncate">{it.name}</p>
              <p className="text-brown/80">{(it.date || '').replaceAll('-', '/')}</p>
              {it.status && <p className="mt-0.5 font-medium text-error">{it.status}</p>}
            </div>
            <ChevronLeftIcon className="h-5 w-5 shrink-0 -scale-x-100 text-brown" />
          </button>
        ))}
      </div>
    </div>
  )
}
