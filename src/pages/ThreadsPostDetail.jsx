import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon, CalendarIcon } from '../components/icons'

import { spring } from '../lib/api'

const POSTS_API = spring('/api/posts')
const IMAGE_PROXY = spring('/api/image?url=')

function fmtDate(s) {
  return s ? String(s).slice(0, 10).replaceAll('-', '/') : ''
}

export default function ThreadsPostDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()

  // 從清單帶過來的資料優先用；直接開網址／重整時再打 API 補回。
  const [post, setPost] = useState(location.state?.post || null)
  const [state, setState] = useState(post ? 'ready' : 'loading')
  const [imgBroken, setImgBroken] = useState(false)

  useEffect(() => {
    if (post) return
    let alive = true
    fetch(POSTS_API)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((list) => {
        const found = Array.isArray(list) ? list.find((p) => p.id === id) : null
        if (!alive) return
        if (found) { setPost(found); setState('ready') } else setState('error')
      })
      .catch(() => { if (alive) setState('error') })
    return () => { alive = false }
  }, [id, post])

  const showImg = post?.image && !imgBroken

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

      {state === 'loading' && <p className="py-10 text-center text-sm text-brown/60">載入中…</p>}
      {state === 'error' && <p className="py-10 text-center text-sm text-error">找不到這則貼文</p>}

      {state === 'ready' && post && (
        <div className="flex flex-col gap-5 px-[22px] pt-5">
          {/* 圖片 */}
          <div className="flex w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#e7e3d5]">
            {showImg ? (
              <img
                src={IMAGE_PROXY + encodeURIComponent(post.image)}
                alt=""
                className="h-[240px] w-full object-cover"
                onError={() => setImgBroken(true)}
              />
            ) : (
              <div className="flex h-[200px] w-full items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-14 w-14 text-brown/30" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C8.1 2 5 5.1 5 9c0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
                </svg>
              </div>
            )}
          </div>

          {/* 日期 + 內文卡 */}
          <div className="flex flex-col gap-3 rounded-[10px] bg-card p-5">
            <div className="flex items-center gap-2.5">
              <CalendarIcon className="h-[28px] w-[28px] text-navy" />
              <span className="text-base text-brown">{fmtDate(post.post_date)}</span>
            </div>
            <span className="text-base font-medium text-brown">內文</span>
            <div className="min-h-[120px] whitespace-pre-wrap rounded-[10px] bg-white p-4 text-sm leading-relaxed text-brown">
              {post.text || '（無內文）'}
            </div>
          </div>

          {/* Threads 連結 */}
          {post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 no-underline"
            >
              <img src="/icons/threads.png" alt="Threads" className="h-9 w-9 shrink-0 object-contain" />
              <div className="flex h-11 min-w-0 flex-1 items-center rounded-[50px] border border-black/15 bg-white px-4">
                <span className="min-w-0 flex-1 truncate text-sm text-brown underline underline-offset-2">
                  {post.url}
                </span>
              </div>
            </a>
          )}
        </div>
      )}
    </div>
  )
}
