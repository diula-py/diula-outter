import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, CalendarIcon, LocationIcon, CircleCheckIcon } from '../components/icons'
import { updateItem } from '../lib/myItems'
import { flask } from '../lib/api'

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="3" strokeLinecap="round" {...props}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  )
}

function ThreadsIcon(props) {
  return (
    <svg viewBox="0 0 192 192" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M141.5 88.2c-.7-.3-1.4-.6-2.1-.9-1.2-22.8-13.7-35.9-34.6-36-.1 0-.2 0-.3 0-12.5 0-22.9 5.3-29.3 15l11.5 7.9c4.8-7.3 12.4-8.9 17.8-8.9h.2c6.7 0 11.8 2 15 5.8 2.3 2.8 3.9 6.6 4.6 11.5-5.6-.9-11.7-1.2-18.1-.8-18.2 1-29.9 11.7-29.1 26.5.4 7.5 4.2 14 10.6 18.2 5.4 3.6 12.4 5.3 19.7 4.9 9.6-.5 17.2-4.2 22.4-10.9 4-5.1 6.5-11.7 7.6-20 4.6 2.8 8 6.4 9.9 10.8 3.2 7.4 3.4 19.5-6.5 29.4-8.7 8.7-19.1 12.4-34.8 12.6-17.5-.1-30.7-5.7-39.3-16.6-8.1-10.2-12.2-25-12.4-44 .2-19 4.3-33.8 12.4-44 8.6-10.9 21.8-16.5 39.3-16.6 17.6.1 31.1 5.8 40 16.7 4.4 5.4 7.7 12.1 9.9 19.9l13.5-3.6c-2.7-9.6-6.9-17.9-12.6-24.8-11.4-14-28.1-21.2-49.6-21.4h-.1c-21.5.2-38 7.4-49.1 21.5C29.8 61 25.2 78.4 25 99.9v.2c.2 21.5 4.8 38.9 15.9 53.1 11.1 14.1 27.6 21.3 49.1 21.5h.1c19.1-.1 32.6-5.1 43.7-16.2 14.5-14.5 14.1-32.7 9.3-43.9-3.4-8-9.9-14.5-18.8-18.9zm-36.2 47.6c-8.1.5-16.5-3.2-16.9-11-.3-5.8 4.1-12.2 17.4-13 1.5-.1 3-.1 4.4-.1 4.8 0 9.3.5 13.4 1.4-1.5 19.1-10.5 22.2-18.3 22.7z" />
    </svg>
  )
}

export default function MyLostDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const passed = location.state?.item

  const item = {
    name: passed?.name || '協尋物品',
    code: passed?.code || '#------',
    date: (passed?.date || '').replaceAll('-', '/') || '—',
    place: passed?.place || '—',
    remark: passed?.remark || '--',
    tags: passed?.tags && passed.tags.length ? passed.tags : [],
    img: passed?.image || passed?.img || null,
  }

  const [status, setStatus] = useState(passed?.status || '自動推播中')
  const [dialog, setDialog] = useState(null) // null | 'confirm' | 'success'
  const [busy, setBusy] = useState(false)
  // Threads 自動發文的貼文連結；非 Threads 的協尋物沒有這欄 → 不顯示連結列。
  const [threadUrl, setThreadUrl] = useState(passed?.thread_post_url || '')
  const [deletingThread, setDeletingThread] = useState(false)
  const found = status === '已找到'

  // 刪除 Threads 協尋文：呼官方 API 刪文 → 清掉本機貼文欄位 → 連結列消失。
  async function deleteThreadPost() {
    setDeletingThread(true)
    try {
      if (passed?.thread_post_id) {
        await fetch(flask('/threads/delete'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: passed.thread_post_id }),
        })
      }
    } catch { /* 網路錯誤也照樣把本機連結清掉，避免卡在已刪的貼文 */ }
    if (passed?.id) updateItem(passed.id, { thread_post_url: '', thread_post_id: '' })
    setThreadUrl('')
    setDeletingThread(false)
  }

  // 按「已找到」→ 刪 Threads 協尋文 / 停訂閱（有的話）→ 更新本機狀態。
  async function confirmFound() {
    setBusy(true)
    try {
      if (passed?.thread_post_id) {
        await fetch(flask('/threads/delete'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: passed.thread_post_id }),
        })
      }
      if (passed?.sub_id) {
        await fetch(flask('/subscriptions/found'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: passed.sub_id }),
        })
      }
    } catch { /* 網路錯誤也照樣標記已找到 */ }
    if (passed?.id) updateItem(passed.id, { status: '已找到' })
    setStatus('已找到')
    setBusy(false)
    setDialog(null)
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-base pb-10">
      {/* Header（cream，90px） */}
      <header className="relative flex h-[90px] items-end justify-center rounded-b-[20px] bg-card pb-4 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute bottom-4 left-[21px] p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <ChevronLeftIcon className="h-[26px] w-[26px] text-brown" />
        </button>
        <h1 className="max-w-[220px] truncate text-xl font-bold text-brown">{item.name}</h1>
      </header>

      <div className="flex flex-col gap-4 px-[22px] pt-4">
        {/* 徽章：狀態 + 編號 */}
        <div className="flex gap-3">
          <span className="rounded-[10px] bg-blue px-4 py-1.5 text-base text-brown">{status}</span>
          {!found && <span className="rounded-[10px] bg-blue px-4 py-1.5 text-base text-brown">{item.code}</span>}
          {found && <span className="ml-auto rounded-[10px] bg-blue px-4 py-1.5 text-base text-brown">{item.code}</span>}
        </div>

        {/* 圖片 */}
        <div className="flex h-[200px] w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#e7e3d5]">
          {item.img ? (
            <img src={item.img} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-14 w-14 text-brown/30" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.1 2 5 5.1 5 9c0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
            </svg>
          )}
        </div>

        {/* 資訊卡：日期 / 地點 / 備註（唯讀） */}
        <div className="flex flex-col gap-2.5 rounded-[10px] bg-card p-4">
          {[
            { icon: <CalendarIcon className="h-[30px] w-[30px] text-navy" />, val: item.date },
            { icon: <LocationIcon className="h-[30px] w-[26px] text-navy" />, val: item.place },
            { icon: <span className="text-base text-brown">備註</span>, val: item.remark },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex w-[46px] shrink-0 items-center justify-center">{row.icon}</div>
              <div className="flex h-10 min-w-0 flex-1 items-center rounded-[10px] bg-white px-4 text-xs text-brown">
                {row.val}
              </div>
            </div>
          ))}
        </div>

        {/* AI 標籤 */}
        {item.tags.length > 0 && (
          <div className="flex flex-col gap-3 rounded-[10px] bg-card p-5">
            <span className="text-base font-semibold text-brown">AI 標籤</span>
            <div className="flex flex-wrap gap-2.5">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-[10px] bg-white px-4 py-1.5 text-center text-xs text-brown">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Threads 協尋文連結（僅 Threads 自動發文的項目有；非 Threads 不顯示） */}
        {threadUrl && (
          <div className="flex items-center gap-2.5 rounded-[10px] bg-card p-2.5">
            <ThreadsIcon className="h-10 w-10 shrink-0 text-brown" />
            <a
              href={threadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-[10px] bg-white px-3
                         text-center text-xs text-black underline underline-offset-2"
            >
              <span className="truncate">{threadUrl}</span>
            </a>
            <button
              type="button"
              onClick={deleteThreadPost}
              disabled={deletingThread}
              className="h-10 shrink-0 rounded-[50px] border border-black bg-white px-4 text-base font-bold text-error
                         transition hover:bg-[#f4f4f4] disabled:opacity-60
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              {deletingThread ? '刪除中' : '刪除'}
            </button>
          </div>
        )}

        {/* 我找到了（找到後隱藏） */}
        {!found && (
          <button
            type="button"
            onClick={() => setDialog('confirm')}
            className="mt-1 flex h-[60px] w-full items-center justify-center gap-4 rounded-[50px] border border-black bg-card
                       text-base font-medium text-brown transition hover:bg-[#eee8d7]
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            <CircleCheckIcon className="h-10 w-10 shrink-0 text-brown" />
            我找到了！立即更新狀態
          </button>
        )}
      </div>

      {/* 確認彈窗 */}
      {dialog === 'confirm' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-6">
          <div className="relative w-[300px] rounded-[10px] bg-card px-6 pb-7 pt-14 shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
            <button
              type="button"
              onClick={() => setDialog(null)}
              aria-label="關閉"
              className="absolute left-4 top-4 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <XIcon className="h-6 w-6" />
            </button>
            <p className="mb-7 text-center text-xl font-medium text-brown">是否確認已找到？</p>
            <div className="flex justify-center gap-5">
              <button
                type="button"
                onClick={() => setDialog('success')}
                className="h-[60px] w-[90px] rounded-[50px] border border-black bg-input text-xl font-medium text-brown"
              >
                是
              </button>
              <button
                type="button"
                onClick={() => setDialog(null)}
                className="h-[60px] w-[90px] rounded-[50px] border border-black bg-blue text-xl font-medium text-brown"
              >
                否
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 成功彈窗 */}
      {dialog === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-6">
          <div className="w-[300px] rounded-[10px] bg-card px-6 py-8 shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
            <p className="mb-6 text-center text-lg font-medium text-brown">已更新狀態為「已找到」</p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={confirmFound}
                disabled={busy}
                className="h-[52px] w-[200px] rounded-[50px] border border-black bg-blue text-base font-medium text-brown disabled:opacity-60"
              >
                {busy ? '更新中…' : '確認'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
