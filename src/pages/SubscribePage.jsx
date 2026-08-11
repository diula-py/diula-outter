import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, CircleCheckIcon } from '../components/icons'
import { addItem } from '../lib/myItems'
import { flask } from '../lib/api'

export default function SubscribePage() {
  const navigate = useNavigate()
  const state = useLocation().state || {}
  const q = state.query || {}
  const resolved = state.resolved || {}
  const results = state.results || []

  const [channel, setChannel] = useState('email') // email | line
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success
  const [error, setError] = useState('')

  const canSubmit = !!resolved.category_id && !!q.date

  async function submit() {
    setError('')
    if (!canSubmit) { setError('缺少比對條件，請從比對結果頁進來'); return }
    if (channel === 'email' && !/^\S+@\S+\.\S+$/.test(email)) { setError('請輸入正確的 Email'); return }
    if (channel === 'line') { setError('LINE 通道需在 LINE App（LIFF）內開啟才能取得你的 LINE ID'); return }

    setStatus('submitting')
    try {
      const res = await fetch(flask('/subscriptions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          email,
          criteria: {
            category_id: resolved.category_id,
            lost_date: q.date,
            free_tags: q.tags || [],
            detail: q.place || undefined,
          },
          seen_ids: results.map((r) => r.item?.external_id || r.id).filter(Boolean),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      addItem({
        id: 'sub_' + Date.now(),
        kind: 'subscription',
        code: '#' + (json.id ? String(json.id).slice(-6) : Date.now().toString().slice(-6)),
        name: resolved.category_name || (q.tags || []).join('、') || '協尋',
        date: q.date,
        place: q.place,
        tags: q.tags || [],
        image: null,
        status: '自動尋找中',
        sub_id: json.id,
        created_at: new Date().toISOString(),
      })
      setStatus('success')
    } catch (e) {
      setError(`訂閱失敗：${e.message}`)
      setStatus('idle')
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-base pb-10">
      <header className="relative flex h-20 items-center justify-center rounded-b-[20px] bg-card pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={() => navigate(-1)} aria-label="返回"
          className="absolute left-[22px] top-1/2 -translate-y-1/2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
          <ChevronLeftIcon className="h-[26px] w-[26px] text-brown" />
        </button>
        <h1 className="text-xl font-bold text-brown">自動尋找並推播</h1>
      </header>

      {status === 'success' ? (
        <div className="flex flex-col items-center gap-4 px-[26px] pt-10 text-center">
          <CircleCheckIcon className="h-14 w-14 text-brown" />
          <p className="text-base font-medium text-brown">訂閱成功！</p>
          <p className="text-xs leading-relaxed text-brown/60">
            每天有新的相符失物，就會用{channel === 'email' ? ' Email ' : ' LINE '}通知你。<br />找到後可在「我的遺失物」停止。
          </p>
          <button type="button" onClick={() => navigate('/')}
            className="mt-2 h-11 rounded-[50px] border border-black bg-blue px-8 text-sm font-medium text-brown">
            返回首頁
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5 px-[26px] pt-5">
          <p className="text-xs leading-relaxed text-brown/70">
            這次沒找到沒關係！訂閱後，<b className="text-brown">每天</b>有新符合條件的失物進來，我們就主動通知你。
          </p>

          {/* 比對條件摘要 */}
          <div className="flex flex-col gap-1.5 rounded-[10px] bg-card p-4 text-sm text-brown">
            <p><span className="text-brown/60">類別：</span>{resolved.category_name || '（未知）'}</p>
            <p><span className="text-brown/60">遺失日：</span>{(q.date || '').replaceAll('-', '/') || '—'}</p>
            <p><span className="text-brown/60">地點：</span>{q.place || '—'}</p>
            <p className="truncate"><span className="text-brown/60">標籤：</span>{(q.tags || []).join('、') || '—'}</p>
          </div>

          {/* 通道 */}
          <div>
            <p className="mb-2 text-sm font-medium text-brown">通知方式</p>
            <div className="flex gap-3">
              {[{ k: 'email', l: 'Email' }, { k: 'line', l: 'LINE' }].map((c) => (
                <button key={c.k} type="button" onClick={() => setChannel(c.k)}
                  className={`h-11 flex-1 rounded-[50px] border border-black text-base text-brown transition
                    ${channel === c.k ? 'border-[1.5px] bg-card font-medium' : 'bg-input font-normal'}`}>
                  {c.l}
                </button>
              ))}
            </div>
          </div>

          {channel === 'email' ? (
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="你的 Email"
              className="w-full rounded-[10px] border border-black bg-white px-4 py-2.5 text-sm text-brown outline-none placeholder:text-brown/50" />
          ) : (
            <p className="rounded-[10px] bg-input p-3 text-xs leading-relaxed text-brown/70">
              LINE 通知需在 <b>LINE App 內</b>開啟本頁（LIFF）才能取得你的 LINE ID。目前用瀏覽器開，請改用 Email。
            </p>
          )}

          {error && <p className="text-sm text-error">{error}</p>}

          <button type="button" onClick={submit} disabled={status === 'submitting'}
            className="mt-1 flex h-[60px] w-full items-center justify-center gap-3 rounded-[50px] border border-black bg-blue
                       text-base font-medium text-brown transition hover:brightness-[.98] disabled:opacity-60
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
            <CircleCheckIcon className="h-9 w-9 shrink-0 text-brown" />
            {status === 'submitting' ? '訂閱中…' : '開啟自動推播'}
          </button>
        </div>
      )}
    </div>
  )
}
