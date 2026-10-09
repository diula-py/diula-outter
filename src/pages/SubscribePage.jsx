import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, CircleCheckIcon } from '../components/icons'
import { addMyItem, updateMyItem } from '../lib/items'
import { markLostHandled } from '../lib/handledLost'
import { useAuth } from '../context/AuthContext'
import { flask } from '../lib/api'
import { getAuthHeaders } from '../lib/authToken'
import { LOST_STATUS } from '../data/itemStatus'
import { downscale } from '../lib/image'
import { titleFromTags } from '../data/tagTaxonomy'

export default function SubscribePage() {
  const navigate = useNavigate()
  const { userId, user } = useAuth()
  const state = useLocation().state || {}
  const q = state.query || {}
  const resolved = state.resolved || {}
  const results = state.results || []

  // 通道依登入方式自動決定：LINE 登入 → LINE 推播（登入時已拿到 userId，電腦用 liff.login()
  // 網頁登入一樣會跳 LINE 取得 ID）；Google 登入 → Email（寄到登入帳號信箱）。不給手動選。
  const channel = user?.provider === 'line' ? 'line' : 'email'
  const email = user?.email || ''
  const [status, setStatus] = useState('idle') // idle | submitting | success
  const [error, setError] = useState('')
  // LINE 推播只送得到官方帳號好友；沒加的話後端會回 add_friend_url，成功頁給連結。
  const [addFriendUrl, setAddFriendUrl] = useState('')

  const canSubmit = !!resolved.category_id && !!q.date

  async function submit() {
    setError('')
    if (!canSubmit) { setError('缺少比對條件，請從比對結果頁進來'); return }
    if (channel === 'email' && !user?.email) {
      setError('這個登入方式沒有已驗證的 Email，請改用 LINE 通道，或改用 Google 登入')
      return
    }
    if (channel === 'email' && !/^\S+@\S+\.\S+$/.test(email)) { setError('請輸入正確的 Email'); return }

    setStatus('submitting')
    try {
      const authHeaders = await getAuthHeaders()
      if (!authHeaders) throw new Error('登入狀態已失效，請重新登入')
      const res = await fetch(flask('/subscriptions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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
      if (channel === 'line') setAddFriendUrl(json.add_friend_url || json.bind?.add_friend_url || '')
      // 使用者上傳的照片一起存進「我的遺失物」；縮小一點，避免超過 Firestore 單筆 1MB 上限
      const image = state.base64Image ? await downscale(state.base64Image, 800, 0.8) : null
      // 更新按下比對時建立的那一筆（沒有的話才新增）
      const fields = {
        kind: 'subscription',
        code: '#' + (json.id ? String(json.id).slice(-6) : Date.now().toString().slice(-6)),
        name: titleFromTags(q.tags || []) || resolved.category_name || '協尋',
        date: q.date,
        place: q.place,
        tags: q.tags || [],
        image,
        status: LOST_STATUS.BROADCASTING,
        sub_id: json.id,
      }
      if (state.lostId) await updateMyItem('lost', state.lostId, fields)
      else await addMyItem('lost', userId, fields)
      markLostHandled(state.lostId) // 發文與自動推播只能擇一
      setStatus('success')
    } catch (e) {
      setError(`訂閱失敗：${e.message}`)
      setStatus('idle')
    }
  }

  // 訂閱成功頁：版面照登錄成功頁（RegisterSuccessPage），沒有 header／返回鍵
  if (status === 'success') {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col items-center bg-paper px-[22px] pb-[40px] text-brown">
        <div className="flex w-full flex-1 flex-col items-center justify-center text-center">
          <CircleCheckIcon className="mb-6 h-[120px] w-[120px]" />
          <h1 className="mb-4 text-xl font-bold leading-5">訂閱成功！</h1>
          {state.lostId && <div className="mb-6 text-xl font-bold leading-5">＃{String(state.lostId).toUpperCase()}</div>}
          <p className="mb-6 max-w-[300px] text-sm font-normal leading-normal">
            五天內有新的相符失物就會用{channel === 'email' ? ' Email ' : ' LINE '}通知你，找到後可在「我的遺失物」中停止。
          </p>
          {channel === 'line' && addFriendUrl && (
            <p className="mb-6 max-w-[300px] text-xs leading-normal text-brown/60">
              推播只送得到官方帳號的好友。還沒加的話{' '}
              <a href={addFriendUrl} target="_blank" rel="noreferrer" className="font-medium text-brown underline">點這裡加好友</a>。
            </p>
          )}
          <button
            type="button"
            onClick={() => navigate('/my/lost', { replace: true })}
            className="text-base font-medium leading-4 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            前往我的遺失物
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="box-border flex h-[60px] w-full max-w-[350px] shrink-0 items-center justify-center rounded-[50px] border border-black bg-blue text-base font-medium
                     transition hover:brightness-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          返回首頁
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col bg-paper pb-10">
      <header className="safe-header relative rounded-b-[20px] bg-card [--header-h:80px]">
        <div className="relative flex h-full items-center justify-center">
          <button type="button" onClick={() => navigate(-1)} aria-label="返回"
            className="back-hit absolute left-[22px] top-1/2 -translate-y-1/2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
            <ChevronLeftIcon className="h-[30px] w-[30px] text-brown" />
          </button>
          <h1 className="text-xl font-bold text-brown">自動尋找並推播</h1>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-[26px] pt-5">
        <p className="text-xs leading-normal text-brown/70">
          這次沒找到沒關係！<br />訂閱後，<b className="text-brown">五日內</b>有新符合條件的失物進來，我們就主動通知你。
        </p>

        {/* 比對條件摘要 */}
        <div className="flex flex-col gap-1.5 rounded-[10px] bg-card p-4 text-sm text-brown">
          <p><span className="text-brown/60">類別：</span>{resolved.category_name || '（未知）'}</p>
          <p><span className="text-brown/60">遺失日：</span>{(q.date || '').replaceAll('-', '/') || '—'}</p>
          <p><span className="text-brown/60">地點：</span>{q.place || '—'}</p>
          <p className="truncate"><span className="text-brown/60">標籤：</span>{(q.tags || []).join('、') || '—'}</p>
        </div>

        {/* 通知方式：依登入方式自動決定，不給手動選 */}
        <div>
          <p className="mb-2 text-sm font-medium text-brown">通知方式</p>
          <div className="flex h-11 items-center justify-center rounded-[50px] border-[1.5px] border-black bg-card text-base font-medium text-brown">
            {channel === 'line' ? 'LINE 推播' : 'Email'}
          </div>
          <p className="mt-2 text-xs leading-normal text-brown/70">
            {channel === 'line'
              ? '你用 LINE 登入，會由丟拉的 LINE 官方帳號推播給你（需為官方帳號好友，還沒加的話訂閱完成後會給你連結）。'
              : '你用 Google 登入，通知會寄到你登入帳號的信箱。'}
          </p>
          {channel === 'email' && (
            <input type="email" value={email} readOnly aria-label="通知信箱"
              className="mt-2 w-full rounded-[10px] border border-black bg-input px-4 py-2.5 text-sm text-brown outline-none" />
          )}
        </div>

        {error && <p className="text-sm leading-normal text-error">{error}</p>}

        <button type="button" onClick={submit} disabled={status === 'submitting'}
          className="mt-1 flex h-[60px] w-full items-center justify-center gap-3 rounded-[50px] border border-black bg-blue
                     text-base font-medium text-brown transition hover:brightness-[.98] disabled:opacity-60
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
          <CircleCheckIcon className="h-9 w-9 shrink-0 text-brown" />
          {status === 'submitting' ? '訂閱中…' : '開啟自動推播'}
        </button>
      </div>
    </div>
  )
}
