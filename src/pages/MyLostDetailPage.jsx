import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon } from '../components/icons'
import { ConfirmFoundModal, DeleteConfirmModal, DeleteSuccessModal } from '../components/DialogKit'
import { DetailHeader, DetailImage, InfoBox, InfoRow, TagsBox, ActionButton, DeleteButton } from '../components/DetailKit'
import { updateMyItem, removeMyItem } from '../lib/items'
import { flask } from '../lib/api'
import { getAuthHeaders } from '../lib/authToken'
import { asset } from '../lib/asset'
import { LOST_STATUS } from '../data/itemStatus'

export default function MyLostDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const passed = location.state?.item

  const item = {
    name: passed?.name || '協尋物品',
    code: passed?.id ? `＃${String(passed.id).toUpperCase()}` : '--', // inner：＃文件 ID（大寫）
    date: (passed?.date || '').replaceAll('-', '/') || '—',
    place: passed?.place || '—',
    tags: passed?.tags && passed.tags.length ? passed.tags : [],
    img: passed?.image || passed?.img || null,
    desc: passed?.desc || '',
  }

  const [status, setStatus] = useState(passed?.status || LOST_STATUS.BROADCASTING)
  const [dialog, setDialog] = useState(null) // null | 'confirm' | 'delete' | 'deleted'
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
        // 後端只讓發文者自己刪，要帶登入憑證（見 diula-outter 的 auth_token.py）。
        const authHeaders = await getAuthHeaders()
        await fetch(flask('/threads/delete'), {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders },
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
      const authHeaders = await getAuthHeaders()
      const headers = { 'Content-Type': 'application/json', ...authHeaders }
      if (passed?.thread_post_id) {
        await fetch(flask('/threads/delete'), {
          method: 'POST', headers,
          body: JSON.stringify({ post_id: passed.thread_post_id }),
        })
      }
      if (passed?.sub_id) {
        await fetch(flask('/subscriptions/found'), {
          method: 'POST', headers,
          body: JSON.stringify({ id: passed.sub_id }),
        })
      }
    } catch { /* 網路錯誤也照樣標記已找到 */ }
    if (passed?.id) updateMyItem(passed.kind || 'lost', passed.id, { status: LOST_STATUS.FOUND })
    setStatus(LOST_STATUS.FOUND)
    setBusy(false)
    setDialog(null)
    navigate('/my/lost', { replace: true })
  }

  // 刪除此筆資料：刪 Firestore 文件 → 「該筆資料已被刪除！」→ 確認後回列表。
  async function deleteItem() {
    setBusy(true)
    try {
      if (passed?.id) await removeMyItem(passed.kind || 'lost', passed.id)
      setDialog('deleted')
    } catch (e) {
      console.error('刪除失敗:', e)
      alert('刪除失敗，請稍後再試')
      setDialog(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col items-center bg-paper pb-[100px]">
      {/* Header 90px：標題 top:55、返回鍵 30×30 在 (21,50) */}
      <DetailHeader title={item.name} onBack={() => navigate(-1)} height={90} titleTop={55} backLeft={20} backTop={50} backSize={30} />

      {/* 狀態／編號徽章：y=110、高 30、藍底圓角 10、padding 7 15、16/400 */}
      <div className="relative mt-5 h-[30px] w-full shrink-0">
        <span className="absolute left-5 top-0 flex h-[30px] items-center rounded-[10px] bg-blue px-[15px] text-base font-normal leading-4">{status}</span>
        <span className="absolute left-[198px] top-0 flex h-[30px] max-w-[175px] items-center overflow-hidden whitespace-nowrap rounded-[10px] bg-blue px-[15px] text-base font-normal leading-4">
          <span className="max-w-[145px] truncate">{item.code}</span>
        </span>
      </div>

      <DetailImage src={item.img} mt={17} desc={item.desc} />

      {/* 資訊卡 340×128：日期／地點（上下各留 19） */}
      <InfoBox height={128}>
        <InfoRow icon={<CalendarIcon className="h-[35px] w-[35px]" />} iconTop={22} pillTop={19} pillLeft={82.5}>{item.date}</InfoRow>
        <InfoRow icon={<LocationIcon className="h-[35px] w-[35px]" />} iconTop={72} pillTop={69} pillLeft={82.5}>{item.place}</InfoRow>
      </InfoBox>

      {item.tags.length > 0 && <TagsBox tags={item.tags} />}

      {/* Threads 協尋文連結（僅 Threads 自動發文的項目有；非 Threads 不顯示） */}
      {threadUrl && (
        <div className="mt-5 box-border flex h-[60px] w-full max-w-[340px] shrink-0 items-center gap-[10px] rounded-[10px] bg-card p-[10px]">
          <img src={asset('/icons/threads.png')} alt="Threads" className="h-10 w-10 shrink-0 object-contain" />
          <a
            href={threadUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 w-[190px] shrink-0 items-center justify-center rounded-[10px] bg-white text-xs font-normal text-black underline"
          >
            <span className="max-w-[170px] truncate">{threadUrl}</span>
          </a>
          <button
            type="button"
            onClick={deleteThreadPost}
            disabled={deletingThread}
            className="box-border h-10 w-[65px] shrink-0 rounded-[50px] border border-black bg-white text-base font-bold text-error disabled:opacity-60
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            {deletingThread ? '刪除中' : '刪除'}
          </button>
        </div>
      )}

      {/* 我找到了（找到後隱藏） */}
      {!found && <ActionButton tone="blue" onClick={() => setDialog('confirm')}>我找到了！立即更新狀態</ActionButton>}

      {/* 刪除此筆資料（inner：我找到了鈕下方 20px；我找到了隱藏時仍顯示） */}
      <DeleteButton onClick={() => setDialog('delete')} />

      {dialog === 'confirm' && <ConfirmFoundModal busy={busy} onCancel={() => setDialog(null)} onConfirm={confirmFound} />}
      {dialog === 'delete' && <DeleteConfirmModal busy={busy} onCancel={() => setDialog(null)} onConfirm={deleteItem} />}
      {dialog === 'deleted' && <DeleteSuccessModal onConfirm={() => navigate('/my/lost', { replace: true })} />}
    </div>
  )
}
