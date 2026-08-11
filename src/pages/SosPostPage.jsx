import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, CircleCheckIcon } from '../components/icons'
import { addItem } from '../lib/myItems'
import { flask } from '../lib/api'

// Threads 抓外部圖有下載逾時上限，原始手機照太大會 2207003（下載逾時）→ 先縮圖再送。
function downscale(dataUrl, maxSide = 1280, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      ctx.fillStyle = '#ffffff' // JPEG 無透明，先鋪白底避免透明區變黑
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      try { resolve(c.toDataURL('image/jpeg', quality)) } catch { resolve(dataUrl) }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// 文案模版（對齊設計稿圖二）
function buildText({ name, date, place, note }) {
  return [
    `🔍【協尋】${name || '（未填）'}`,
    '',
    `📅 遺失日期：${(date || '').replaceAll('-', '/') || '（未填）'}`,
    `📍 遺失地點：${place || '（未填）'}`,
    ...(note ? [`📝 ${note}`] : []),
    '',
    '有看到或撿到的朋友，請在這篇貼文底下留言，感謝你的幫忙 🙏',
    '#協尋 #遺失物 #DiuLa',
  ].join('\n')
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="3" strokeLinecap="round" {...props}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  )
}

export default function SosPostPage() {
  const navigate = useNavigate()
  const state = useLocation().state || {}
  const q = state.query || {}
  const rawImage = state.base64Image || null // 預覽直接用原圖；送出時才縮圖

  const date = q.date || ''    // 鎖死：來自比對條件
  const place = q.place || ''   // 鎖死：來自比對條件

  const [name, setName] = useState((q.tags && q.tags.join('、')) || '')
  const [detail, setDetail] = useState('') // 詳細遺失地點（選填）
  const [note, setNote] = useState('')     // 備註（選填）
  const [agree, setAgree] = useState(false)
  const [status, setStatus] = useState('idle') // idle | submitting | success
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const fullPlace = [place, detail.trim()].filter(Boolean).join(' ')
  const text = buildText({ name, date, place: fullPlace, note: note.trim() })

  async function submit() {
    setError('')
    if (!name.trim()) { setError('請填物品名稱'); return }
    if (!agree) { setError('請先勾選授權同意'); return }
    setStatus('submitting')
    try {
      // 送出當下才縮圖，保證不會送到還沒縮的原圖（Threads 抓大圖會逾時 2207003）。
      const image = rawImage ? await downscale(rawImage) : null
      const res = await fetch(flask('/threads/submit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, image, name, lost_date: date, location: fullPlace }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      // 存進「我的遺失物」本機紀錄，讓發出去的協尋出現在清單。
      addItem({
        id: 'sos_' + Date.now(),
        kind: 'threads',
        code: '#' + (json.post_id ? String(json.post_id).slice(-6) : Date.now().toString().slice(-6)),
        name: name.trim(),
        date,
        place: fullPlace,
        remark: note.trim(),
        tags: q.tags || [],
        image,
        status: '自動推播中',
        thread_post_id: json.post_id,
        thread_post_url: json.permalink,
        created_at: new Date().toISOString(),
      })
      setResult(json)
      setStatus('success')
    } catch (e) {
      setError(`發布失敗：${e.message}`)
      setStatus('idle')
    }
  }

  const lockedBox = 'flex h-11 items-center rounded-[10px] bg-white px-4 text-sm text-brown'
  const inputBox = 'w-full rounded-[10px] bg-white px-4 py-2.5 text-sm text-brown outline-none placeholder:text-brown/50'

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-base pb-10">
      <header className="relative flex h-20 items-center justify-center rounded-b-[20px] bg-card pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={() => navigate(-1)} aria-label="返回"
          className="absolute left-[22px] top-1/2 -translate-y-1/2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
          <ChevronLeftIcon className="h-[26px] w-[26px] text-brown" />
        </button>
        <h1 className="text-xl font-bold text-brown">發布協尋文</h1>
      </header>

      <div className="flex flex-col gap-5 px-[26px] pt-5">
          <p className="text-xs leading-relaxed text-brown/70">
            由 <b className="text-brown">DiuLa 官方帳號</b> 幫你把協尋資訊發到 Threads，擴大協尋範圍。
          </p>

          <div className="flex flex-col gap-3 rounded-[10px] bg-card p-4">
            <label className="text-sm font-medium text-brown">物品名稱
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：黑色折疊傘" className={`mt-1 ${inputBox}`} />
            </label>
            <div className="text-sm font-medium text-brown">遺失日期
              <div className={`mt-1 ${lockedBox}`}>{(date || '').replaceAll('-', '/') || '—'}</div>
            </div>
            <div className="text-sm font-medium text-brown">遺失地點
              <div className={`mt-1 ${lockedBox}`}>{place || '—'}</div>
            </div>
            <label className="text-sm font-medium text-brown">詳細遺失地點（選填）
              <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="例：捷運出口、某櫃檯、幾號門…" className={`mt-1 ${inputBox}`} />
            </label>
            <label className="text-sm font-medium text-brown">備註（選填）
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="補充特徵、顏色、聯絡方式…" className={`mt-1 ${inputBox}`} />
            </label>
          </div>

          {/* 官方帳號實際會發出的貼文（即時預覽） */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-brown">📤 官方帳號實際會發出這篇（即時預覽）</p>
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brown text-lg font-bold text-white">@</div>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-brown">DiuLa 協尋</p>
                  <p className="text-xs text-brown/50">diula_official</p>
                </div>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-brown">{text}</pre>
              {rawImage && (
                <img src={rawImage} alt="協尋照片" className="mt-3 w-full rounded-xl border border-black/5 object-cover" />
              )}
            </div>
          </div>

          {/* 授權同意 */}
          <label className="flex items-start gap-3 rounded-[10px] bg-[#ece8f5] p-3 text-xs leading-relaxed text-brown">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#492c13]" />
            <span>我同意授權「DiuLa 官方帳號」依上方模版代為發佈，並瞭解找到後可隨時要求刪除。</span>
          </label>

          {error && <p className="text-sm text-error">{error}</p>}

          <button type="button" onClick={submit} disabled={status === 'submitting' || !agree}
            className="mt-1 flex h-[60px] w-full items-center justify-center gap-3 rounded-[50px] border border-black bg-blue
                       text-base font-medium text-brown transition hover:brightness-[.98] disabled:opacity-50
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
            <CircleCheckIcon className="h-9 w-9 shrink-0 text-brown" />
            {status === 'submitting' ? '發布中…' : '發布協尋文'}
          </button>
      </div>

      {/* 發布成功彈窗 */}
      {status === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-6">
          <div className="relative w-[300px] rounded-[10px] bg-card px-6 pb-8 pt-14 shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
            <button
              type="button"
              onClick={() => navigate('/my/lost')}
              aria-label="關閉"
              className="absolute left-4 top-4 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <XIcon className="h-6 w-6" />
            </button>
            <p className="mb-7 text-center text-xl font-medium text-brown">Threads串文已排定發佈！</p>
            <button
              type="button"
              onClick={() => navigate('/my/lost')}
              className="h-[60px] w-full rounded-[50px] border border-black bg-blue text-xl font-medium text-brown
                         transition hover:brightness-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              返回我的遺失物
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
