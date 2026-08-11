import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
} from '../components/icons'

import { spring } from '../lib/api'

const POSTS_API = spring('/api/posts')
const IMAGE_PROXY = spring('/api/image?url=')

// "2026-08-08T04:14:48.000Z" → "2026/08/08"
function fmtDate(s) {
  if (!s) return ''
  const d = String(s).slice(0, 10).replaceAll('-', '/')
  return d
}

/** 貼文縮圖：有圖走 proxy，失效／無圖顯示 placeholder（依後端設計，圖過期是正常的）。 */
function Thumb({ url }) {
  const [broken, setBroken] = useState(false)
  const showImg = url && !broken
  return (
    <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#e7e3d5]">
      {showImg ? (
        <img
          src={IMAGE_PROXY + encodeURIComponent(url)}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <svg viewBox="0 0 24 24" className="h-9 w-9 text-brown/40" fill="currentColor" aria-hidden="true">
          <path d="M12 2C8.1 2 5 5.1 5 9c0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
        </svg>
      )}
    </div>
  )
}

export default function ThreadsSearchPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [state, setState] = useState('loading') // loading | ready | error
  const [query, setQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    let alive = true
    fetch(POSTS_API)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data) => { if (alive) { setPosts(Array.isArray(data) ? data : []); setState('ready') } })
      .catch(() => { if (alive) setState('error') })
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim()
    return posts.filter((p) => {
      const okText = !q || String(p.text || '').includes(q)
      const okDate = !dateFilter || String(p.post_date || '').slice(0, 10) === dateFilter
      return okText && okDate
    })
  }, [posts, query, dateFilter])

  return (
    <div>
      {/* Header */}
      <header className="relative flex h-20 items-center justify-center rounded-b-[20px] bg-card pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute left-[22px] top-1/2 -translate-y-1/2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <ChevronLeftIcon className="h-6 w-6 text-brown" />
        </button>
        <h1 className="text-xl font-bold text-brown">Threads尋找遺失物</h1>
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
        {state === 'loading' && <p className="py-10 text-center text-sm text-brown/60">載入中…</p>}
        {state === 'error' && (
          <p className="py-10 text-center text-sm text-error">
            載入失敗，請確認後端（:8080）有啟動。
          </p>
        )}
        {state === 'ready' && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-brown/60">沒有符合的貼文</p>
        )}

        {state === 'ready' &&
          filtered.map((p) => (
            <Link
              key={p.id}
              to={`/search/threads/${p.id}`}
              state={{ post: p }}
              className="flex items-center gap-5 rounded-[10px] border border-black bg-input p-[25px] no-underline
                         transition hover:bg-[#efefef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <Thumb url={p.image} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-3 text-base font-medium leading-relaxed text-brown">
                  {p.text || '（無內文）'}
                </p>
                <p className="mt-1 text-xs text-brown/70">{fmtDate(p.post_date)}</p>
              </div>
              <ChevronLeftIcon className="h-5 w-5 shrink-0 -scale-x-100 text-brown" />
            </Link>
          ))}
      </div>
    </div>
  )
}
