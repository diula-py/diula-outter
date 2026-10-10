import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon, CalendarIcon, DiulaPinIcon } from '../components/icons'

import { fetchThreadsPosts } from '../lib/api'
import { asset } from '../lib/asset'

// post_date 是 UTC（例如 2026-10-09T22:42:52.000Z），直接切前 10 個字，台灣清晨的貼文會少一天。
// 先換成本地時間再取年月日（同 lib/date.js 的做法）。
function fmtDate(s) {
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return String(s).slice(0, 10).replaceAll('-', '/')
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}/${m}/${day}`
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
    fetchThreadsPosts()
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
    // 沒有 AppLayout（無 TabBar），外框與底部留白（含 iOS safe-area）自己處理
    <div className="mx-auto min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] bg-paper pb-[calc(40px+env(safe-area-inset-bottom))]">
      {/* Header */}
      <header className="safe-header relative rounded-b-[20px] bg-card [--header-h:80px]">
        <div className="relative flex h-full items-center justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="返回"
            className="back-hit absolute left-[22px] top-1/2 -translate-y-1/2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            <ChevronLeftIcon className="h-[30px] w-[30px] text-brown" />
          </button>
          <h1 className="text-xl font-bold text-brown">Threads尋找遺失物</h1>
        </div>
      </header>

      {state === 'loading' && <p className="py-10 text-center text-sm leading-normal text-brown/60">載入中…</p>}
      {state === 'error' && <p className="py-10 text-center text-sm leading-normal text-error">找不到這則貼文</p>}

      {state === 'ready' && post && (
        <div className="flex flex-col gap-5 px-[22px] pt-5">
          {/* 圖片 */}
          <div className="flex w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#e7e3d5]">
            {showImg ? (
              // 載快照給的網址（同列表頁，不繞會休眠的 Spring Boot 代理）。
              // 圖是自家鏡像在 diula-web 的 webp，不會像 Instagram CDN 的簽章網址那樣過期。
              <img
                src={post.image}
                alt=""
                decoding="async"
                referrerPolicy="no-referrer"
                className="h-[240px] w-full object-cover"
                onError={() => setImgBroken(true)}
              />
            ) : (
              <div className="flex h-[200px] w-full items-center justify-center">
                <DiulaPinIcon className="h-20 w-20" />
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
            <div className="min-h-[120px] whitespace-pre-wrap rounded-[10px] bg-white p-4 text-sm leading-normal text-brown">
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
              <img src={asset('/icons/threads.png')} alt="Threads" className="h-9 w-9 shrink-0 object-contain" />
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
