import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, CalendarIcon, LocationIcon, CircleCheckIcon, DiulaPinIcon, XmarkIcon } from '../components/icons'
import { updateMyItem } from '../lib/items'
import { flask } from '../lib/api'
import { asset } from '../lib/asset'
import { LOST_STATUS } from '../data/itemStatus'

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

  const [status, setStatus] = useState(passed?.status || LOST_STATUS.BROADCASTING)
  const [dialog, setDialog] = useState(null) // null | 'confirm' | 'success'
  const [busy, setBusy] = useState(false)
  // Threads 自動發文的貼文連結；非 Threads 的協尋物沒有這欄 → 不顯示連結列。
  const [threadUrl, setThreadUrl] = useState(passed?.thread_post_url || '')
  const [deletingThread, setDeletingThread] = useState(false)
  const found = status === LOST_STATUS.FOUND

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
    if (passed?.id) updateMyItem(passed.kind || 'lost', passed.id, { thread_post_url: '', thread_post_id: '' })
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
    if (passed?.id) updateMyItem(passed.kind || 'lost', passed.id, { status: LOST_STATUS.FOUND })
    setStatus(LOST_STATUS.FOUND)
    setBusy(false)
    setDialog(null)
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-base pb-10">
      {/* Header（cream，90px） */}
      <header className="relative flex h-[90px] items-end justify-center rounded-b-[20px] bg-card pb-4 pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute bottom-4 left-[21px] p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <ChevronLeftIcon className="h-[30px] w-[30px] text-brown" />
        </button>
        <h1 className="max-w-[220px] truncate text-xl font-bold text-brown">{item.name}</h1>
      </header>

      <div className="flex flex-col gap-4 px-[22px] pt-4">
        {/* 徽章：狀態（左）＋ 編號（靠右） */}
        <div className="flex items-center gap-3">
          <span className="rounded-[10px] bg-blue px-4 py-1.5 text-base text-brown">{status}</span>
          <span className="ml-auto rounded-[10px] bg-blue px-4 py-1.5 text-base text-brown">{item.code}</span>
        </div>

        {/* 圖片 */}
        <div className="flex h-[200px] w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#e7e3d5]">
          {item.img ? (
            <img src={item.img} alt="" className="h-full w-full object-cover" />
          ) : (
            <DiulaPinIcon className="h-20 w-20" />
          )}
        </div>

        {/* 資訊卡：日期 / 地點 / 備註（唯讀） */}
        <div className="flex flex-col gap-2.5 rounded-[10px] bg-card p-4">
          {[
            { icon: <CalendarIcon className="h-[35px] w-[35px] text-navy" />, val: item.date },
            { icon: <LocationIcon className="h-[35px] w-[35px] text-navy" />, val: item.place },
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
            <img src={asset('/icons/threads.png')} alt="Threads" className="h-9 w-9 shrink-0 object-contain" />
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
            className="mt-1 flex h-[60px] w-full items-center justify-center gap-4 rounded-[50px] border border-black bg-blue
                       text-base font-medium text-brown transition hover:brightness-[.98]
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
              <XmarkIcon className="h-[35px] w-[35px]" />
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
