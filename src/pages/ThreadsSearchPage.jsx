import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon } from '../components/icons'
import { FormHeader } from '../components/FormKit'

import { fetchThreadsPosts } from '../lib/api'
import { normalizeIdWording } from '../lib/text'
import { asset } from '../lib/asset'

/**
 * 貼文縮圖：直接載 Instagram CDN 的圖（CDN 允許跨站嵌入，約 0.3 秒），
 * 不再繞 Spring Boot /api/image 代理——那台在 Render 免費方案會休眠，冷啟動 ~50 秒，圖要等很久。
 * 捲到才載（lazy），一張約 500KB，不會一進來就抓 47 張。
 * 沒有圖、或網址過期（CDN 網址約 3～5 天失效，回 403）→ 藍底驚嘆號 logo（同比對結果頁的預設圖）。
 */
function Thumb({ url }) {
  const [broken, setBroken] = useState(false)
  const showImg = url && !broken
  return (
    <div className="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-[10px] bg-card">
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
  const [posts, setPosts] = useState([])
  const [state, setState] = useState('loading') // loading | ready | error | offline
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    fetchThreadsPosts()
      .then((data) => { if (alive) { setPosts(Array.isArray(data) ? data : []); setState('ready') } })
      .catch((e) => { if (alive) setState(e?.offline ? 'offline' : 'error') })
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
    // 沒有 AppLayout（無 TabBar），外框與底部留白（含 iOS safe-area）自己處理
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col items-center bg-paper pb-[calc(40px+env(safe-area-inset-bottom))]">
      <FormHeader title="Threads尋找遺失物" onBack={() => navigate(-1)} />

      {/* 搜尋列（inner）：寬 calc(100% - 44px)、最大 340、高 46、圓角 10、padding 10 20、間距 10、icon 20×20 */}
      <div className="mt-5 box-border flex h-[46px] w-[calc(100%-44px)] max-w-[340px] shrink-0 items-center gap-[10px] rounded-[10px] border border-black bg-input px-5 py-[10px]">
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
      <div className="mt-5 flex w-[calc(100%-40px)] max-w-[340px] flex-col gap-[15px]">
        {state === 'loading' && <div className="py-5 text-center text-base opacity-60">載入中...</div>}
        {state === 'error' && <div className="py-5 text-center text-sm leading-normal text-error">載入失敗，請確認後端（:8080）有啟動。</div>}
        {state === 'offline' && <div className="py-5 text-center text-sm leading-normal text-error">目前離線，尚未儲存 Threads 貼文，請連上網路後再試一次</div>}
        {state === 'ready' && filtered.length === 0 && <div className="py-5 text-center text-base opacity-60">目前尚無 Threads 協尋文</div>}

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
    </div>
  )
}
