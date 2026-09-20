import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon } from '../components/icons'
import { FormHeader } from '../components/FormKit'

import { spring } from '../lib/api'

const POSTS_API = spring('/api/posts')
const IMAGE_PROXY = spring('/api/image?url=')

/** 貼文縮圖：有圖走 proxy，失效／無圖顯示 placeholder（依後端設計，圖過期是正常的）。 */
function Thumb({ url }) {
  const [broken, setBroken] = useState(false)
  const showImg = url && !broken
  return (
    <div className="h-[100px] w-[100px] shrink-0 overflow-hidden rounded-[10px] bg-card">
      {showImg && (
        <img
          src={IMAGE_PROXY + encodeURIComponent(url)}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
    </div>
  )
}

export default function ThreadsSearchPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [state, setState] = useState('loading') // loading | ready | error
  const [query, setQuery] = useState('')

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
      return okText
    })
  }, [posts, query])

  return (
    <div className="flex flex-col items-center pb-[120px]">
      <FormHeader title="Threads尋找遺失物" onBack={() => navigate(-1)} />

      {/* 搜尋列（inner）：寬 calc(100% - 44px)、最大 340、高 46、padding 10 20、間距 10、icon 20×20 */}
      <div className="mt-5 box-border flex h-[46px] w-[calc(100%-44px)] max-w-[340px] shrink-0 items-center gap-[10px] rounded-[50px] border border-black bg-input px-5 py-[10px]">
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
      <div className="mt-5 flex w-full max-w-[340px] flex-col gap-[15px]">
        {state === 'loading' && <div className="py-5 text-center text-base opacity-60">載入中...</div>}
        {state === 'error' && <div className="py-5 text-center text-sm leading-normal text-error">載入失敗，請確認後端（:8080）有啟動。</div>}
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
