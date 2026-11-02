// 協尋文人工審核的小後台（/admin）。
//
// 為什麼做在使用者 app 裡而不是另開一個站：授權沿用既有的 Firebase／LINE 登入，
// 後端只多比對一組 ADMIN_OWNER_IDS 白名單（見 diula-outter 的 require_admin），
// 不必自製一套管理者密碼登入——那是這類專案最容易出事的地方。
// 真正的權限在後端：不是管理者的人打 /admin/sos/* 一律 404，這頁會顯示「沒有權限」。
// 前端不做任何隱藏，因為前端藏不住東西，也不需要藏。
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DetailHeader } from '../components/DetailKit'
import { adminSosApprove, adminSosQueue, adminSosReject, adminSosTakedown, wakeFlask } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { LoadingInline } from '../components/LoadingScreen'

const TABS = [
  { key: 'pending', label: '待審' },
  { key: 'posted', label: '已發佈' },
  { key: 'rejected', label: '已退件' },
]

// AI 判斷結果的徽章顏色：擋下的要一眼看得出來。
const AI_TONE = {
  reject: 'bg-error text-white',
  review: 'bg-blue',
  pass: 'bg-input',
}

function AiVerdict({ ai }) {
  if (!ai) return null
  const conf = typeof ai.confidence === 'number' ? ai.confidence.toFixed(2) : '—'
  return (
    <div className="flex flex-col gap-1 text-xs leading-normal text-brown">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-[6px] px-2 py-0.5 font-medium ${AI_TONE[ai.decision] || 'bg-input'}`}>
          AI：{ai.decision}（{conf}）
        </span>
        {/* source=rules 代表本機 regex 就判掉了，沒有呼叫 Gemini */}
        <span className="rounded-[6px] bg-input px-2 py-0.5">{ai.source}</span>
        {(ai.risks || []).map((r) => (
          <span key={r} className="rounded-[6px] bg-error/15 px-2 py-0.5 text-error">{r}</span>
        ))}
      </div>
      {ai.reason && <p className="opacity-80">{ai.reason}</p>}
    </div>
  )
}

export default function AdminSosPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('pending')
  const [items, setItems] = useState(null)   // null = 載入中
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  useEffect(() => { wakeFlask() }, [])

  const load = useCallback(async (status) => {
    setItems(null)
    setError('')
    try {
      setItems(await adminSosQueue(status))
    } catch (e) {
      // 後端對非管理者一律回 404，講清楚比顯示「找不到這個頁面」有用。
      setError(e.status === 404 ? '這個帳號沒有審核權限' : friendlyError(e))
      setItems([])
    }
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  async function act(id, fn) {
    setBusyId(id)
    setError('')
    try {
      await fn()
      setItems((prev) => prev.filter((it) => it.id !== id))
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setBusyId('')
    }
  }

  const approve = (id) => act(id, () => adminSosApprove(id))
  const takedown = (id) => {
    if (!window.confirm('確定要把這則貼文從 Threads 下架？')) return
    act(id, () => adminSosTakedown(id))
  }
  const reject = (id) => {
    const reason = window.prompt('退件原因（會原樣通知使用者）')
    if (reason === null) return
    act(id, () => adminSosReject(id, reason))
  }

  return (
    <div className="mx-auto min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[720px] bg-paper pb-[calc(24px+env(safe-area-inset-bottom))]">
      <DetailHeader title="協尋文審核" onBack={() => navigate('/')} height={90} titleTop={55} backLeft={20} backTop={50} backSize={30} />

      <div className="flex gap-2 px-5 pt-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-[50px] border-black px-4 py-1.5 text-xs font-normal text-brown transition
                        ${tab === t.key ? 'border-[1.5px] bg-card' : 'border bg-input hover:brightness-[.98]'}`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => load(tab)}
          className="ml-auto rounded-[50px] border border-black bg-card px-4 py-1.5 text-xs font-normal text-brown transition hover:brightness-[.98]"
        >
          重新整理
        </button>
      </div>

      {error && <p className="px-5 pt-3 text-sm text-error">{error}</p>}

      <div className="flex flex-col gap-4 px-5 pt-4">
        {items === null && <LoadingInline />}
        {items?.length === 0 && !error && <p className="text-xs text-brown opacity-70">沒有資料</p>}

        {items?.map((it) => (
          <div key={it.id} className="flex flex-col gap-3 rounded-[10px] bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-brown">
              <span className="font-medium">{it.name || '（無名稱）'}</span>
              <span className="opacity-60">{(it.created_at || '').slice(0, 16).replace('T', ' ')}</span>
            </div>

            <AiVerdict ai={it.ai} />

            <pre className="whitespace-pre-wrap rounded-[10px] bg-input p-3 font-sans text-xs leading-normal text-brown">{it.text}</pre>

            {it.image_url && (
              <a href={it.image_url} target="_blank" rel="noreferrer">
                <img src={it.image_url} alt="協尋照片" className="max-h-[260px] w-full rounded-[10px] object-contain" />
              </a>
            )}

            <p className="text-[11px] text-brown opacity-60">
              {it.owner_id}
              {it.lost_id ? ` · ${it.lost_id}` : ''}
              {it.reviewer ? ` · 由 ${it.reviewer}` : ''}
              {it.reject_reason ? ` · ${it.reject_reason}` : ''}
            </p>

            <div className="flex gap-2">
              {it.status === 'pending' && (
                <>
                  <button type="button" disabled={busyId === it.id} onClick={() => approve(it.id)}
                    className="rounded-[50px] border border-black bg-blue px-5 py-2 text-xs font-normal text-brown disabled:opacity-50">
                    {busyId === it.id ? '處理中…' : '核准並發佈'}
                  </button>
                  <button type="button" disabled={busyId === it.id} onClick={() => reject(it.id)}
                    className="rounded-[50px] border border-black bg-white px-5 py-2 text-xs font-normal text-error disabled:opacity-50">
                    退件
                  </button>
                </>
              )}
              {it.status === 'posted' && (
                <>
                  {it.permalink && (
                    <a href={it.permalink} target="_blank" rel="noreferrer"
                      className="rounded-[50px] border border-black bg-white px-5 py-2 text-xs font-normal text-brown">
                      看貼文
                    </a>
                  )}
                  <button type="button" disabled={busyId === it.id} onClick={() => takedown(it.id)}
                    className="rounded-[50px] border border-black bg-white px-5 py-2 text-xs font-normal text-error disabled:opacity-50">
                    {busyId === it.id ? '處理中…' : '下架'}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
