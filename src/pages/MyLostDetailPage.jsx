import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon, ChevronLeftIcon, CircleCheckIcon } from '../components/icons'
import { ConfirmFoundModal, DeleteConfirmModal, DeleteSuccessModal, DeleteThreadConfirmModal } from '../components/DialogKit'
import { DetailHeader, DetailImage, InfoBox, InfoRow, TagsBox, ActionButton, DeleteButton } from '../components/DetailKit'
import DesktopTopNav from '../components/DesktopTopNav'
import DesktopFooter from '../components/DesktopFooter'
import { updateMyItem, removeMyItem } from '../lib/items'
import { flask, wakeFlask } from '../lib/api'
import { syncSosReview } from '../lib/sosReview'
import { getAuthHeaders } from '../lib/authToken'
import { asset } from '../lib/asset'
import { LOST_STATUS, statusColor } from '../data/itemStatus'

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
  // 桌機版照設計稿把地點拆成縣市／其餘兩個方框顯示；item.place 是單一合併字串
  // （手機版整行顯示），這裡只在桌機版切一次，不影響手機版、也不改資料本身。
  const [placeCity, ...placeRest] = item.place.split(' ')
  const placeRestText = placeRest.join(' ')

  const [status, setStatus] = useState(passed?.status || LOST_STATUS.BROADCASTING)
  const [dialog, setDialog] = useState(null) // null | 'confirm' | 'delete' | 'deleted'
  const [busy, setBusy] = useState(false)
  // 刪除、我找到了都會先打 Flask，一進頁面就先叫醒它
  useEffect(() => { wakeFlask() }, [])
  // Threads 自動發文的貼文連結；非 Threads 的協尋物沒有這欄 → 不顯示連結列。
  const [threadUrl, setThreadUrl] = useState(passed?.thread_post_url || '')
  const [deletingThread, setDeletingThread] = useState(false)
  const found = status === LOST_STATUS.FOUND

  // 還在審核中的協尋文：問後端審過了沒，審完就把狀態補上（見 lib/sosReview.js，
  // 那邊有解釋為什麼這件事得由前端做）。查不到就什麼都不變。
  const [reviewReason, setReviewReason] = useState(passed?.sos_review_reason || '')
  useEffect(() => {
    let alive = true
    syncSosReview(passed).then((patch) => {
      if (!alive || !patch) return
      setStatus(patch.status)
      if (patch.thread_post_url) setThreadUrl(patch.thread_post_url)
      if (patch.sos_review_reason !== undefined) setReviewReason(patch.sos_review_reason)
    })
    return () => { alive = false }
  }, [passed])

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

  // 刪除此筆資料：先停掉自動推播訂閱、撤下 Threads 協尋文（避免刪了紀錄還一直收到通知／
  // 留下孤兒貼文），再刪本機紀錄 →「該筆資料已被刪除！」→ 確認後回列表。
  async function deleteItem() {
    setBusy(true)
    // 後端清理（best-effort）：網路錯誤也照樣刪本機，不卡住使用者
    try {
      const authHeaders = await getAuthHeaders()
      const headers = { 'Content-Type': 'application/json', ...authHeaders }
      if (passed?.sub_id) {
        await fetch(flask('/subscriptions/found'), {
          method: 'POST', headers, body: JSON.stringify({ id: passed.sub_id }),
        })
      }
      if (passed?.thread_post_id) {
        await fetch(flask('/threads/delete'), {
          method: 'POST', headers, body: JSON.stringify({ post_id: passed.thread_post_id }),
        })
      }
    } catch { /* 清理失敗也照樣刪本機 */ }
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
    <>
    {/* ======== 手機／手機橫放：維持原本版型，桌機（lg:）整個藏起來 ======== */}
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col items-center bg-paper pb-[100px] land:grid land:max-w-none land:grid-cols-[repeat(2,minmax(0,340px))] land:content-start land:items-start land:justify-center land:gap-x-7 land:gap-y-3 land:[grid-auto-flow:row_dense] land:pb-6 lg:hidden">
      {/* Header 90px：標題 top:55、返回鍵 30×30 在 (21,50) */}
      <DetailHeader title={item.name} onBack={() => navigate(-1)} height={90} titleTop={55} backLeft={20} backTop={50} backSize={30} />

      {/* 狀態／編號徽章：y=110、高 30、藍底圓角 10、padding 7 15、16/400。
          這一排跟下方圖片框同寬（畫面寬 −40、最寬 340、置中）：狀態靠左、編號靠右，左右都對齊圖片框。
          編號用 12px（design.md Body 2）：最長的編號（如 ＃DL-LI-260902-WMW）約 128px；
          320 寬的舊手機再縮到 11px、左右內距 10，留給編號的寬度才夠 */}
      <div className="mt-5 flex h-[30px] w-[calc(100%-40px)] max-w-[340px] shrink-0 justify-between gap-[10px] land:col-start-1 land:mt-0 land:w-full land:max-w-none">
        <span className="flex h-[30px] shrink-0 items-center rounded-[10px] bg-blue px-[15px] text-base font-normal leading-4">{status}</span>
        <span className="flex h-[30px] min-w-0 items-center overflow-hidden whitespace-nowrap rounded-[10px] bg-blue px-[15px] text-xs font-normal leading-4 max-[374px]:px-[10px] max-[374px]:text-[11px]">
          <span className="min-w-0 truncate">{item.code}</span>
        </span>
      </div>

      <DetailImage src={item.img} mt={17} desc={item.desc} />

      {/* 資訊卡 340×128：日期／地點（上下各留 19） */}
      <InfoBox height={128}>
        <InfoRow icon={<CalendarIcon className="h-[35px] w-[35px]" />} iconTop={22} pillTop={19} pillLeft={82.5}>{item.date}</InfoRow>
        <InfoRow icon={<LocationIcon className="h-[35px] w-[35px]" />} iconTop={72} pillTop={69} pillLeft={82.5}>{item.place}</InfoRow>
      </InfoBox>

      {item.tags.length > 0 && <TagsBox tags={item.tags} />}

      {/* 審核中／被退件的說明。審核中時還沒有貼文連結，不說一聲使用者會以為發文壞了。 */}
      {(status === LOST_STATUS.REVIEWING || reviewReason) && (
        <div className="mt-5 box-border w-[calc(100%-40px)] max-w-[340px] shrink-0 rounded-[10px] bg-card p-[15px] text-xs font-medium leading-normal text-brown land:col-start-2 land:mt-0 land:w-full land:max-w-none">
          {status === LOST_STATUS.REVIEWING
            ? '協尋文審核中，通過後會由 DiuLa! 官方帳號發佈並通知你。'
            : `協尋文沒有通過審核${reviewReason ? `：${reviewReason}` : ''}，修改內容後可以再送一次。`}
        </div>
      )}

      {/* Threads 協尋文連結（僅 Threads 自動發文的項目有；非 Threads 不顯示） */}
      {threadUrl && (
        <div className="mt-5 box-border flex h-[60px] w-[calc(100%-40px)] max-w-[340px] shrink-0 items-center gap-[10px] rounded-[10px] bg-card p-[10px] land:col-start-2 land:mt-0 land:w-full land:max-w-none">
          <img src={asset('/icons/threads.png')} alt="Threads" className="h-10 w-10 shrink-0 object-contain" />
          <a
            href={threadUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 min-w-0 max-w-[190px] flex-1 items-center justify-center rounded-[10px] bg-white text-xs font-normal text-black underline"
          >
            <span className="max-w-[calc(100%-20px)] truncate">{threadUrl}</span>
          </a>
          <button
            type="button"
            onClick={() => setDialog('deleteThread')}
            disabled={deletingThread}
            className="box-border h-10 w-[65px] shrink-0 rounded-[50px] border border-black bg-white text-base font-medium text-error disabled:opacity-60
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
    </div>

    {/* ======== 桌機（lg:）：照 2026-11 Figma「我的遺失物詳情」CSS。跟其他詳情/表單頁一樣
        不動共用的 DetailKit（MyFoundDetailPage 也在用），自己寫 768 置中欄，狀態/動作邏輯
        整頁共用。地點拆兩個方框（city/其餘）、日期跟編號各自一個方框，照 CSS 的視覺語言；
        狀態文字（已找到／自動推播中…）放標題列右側，用跟手機版同一個 statusColor()。 ======== */}
    <div className="hidden min-h-screen w-full flex-col items-center bg-paper lg:flex">
      <DesktopTopNav />

      <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-8 px-6 pb-16 pt-10 box-border">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate(-1)} aria-label="返回" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center">
              <ChevronLeftIcon className="h-[30px] w-[30px] text-brown" />
            </button>
            <h1 className="m-0 max-w-[460px] truncate text-2xl font-normal text-[#2F1702]">{item.name}</h1>
          </div>
          <span className="shrink-0 text-xl" style={{ color: statusColor(status) }}>{status}</span>
        </div>

        <div className="flex h-[300px] w-full items-center justify-center overflow-hidden rounded-lg border border-black bg-white">
          {item.img ? (
            <img src={item.img} alt="" className="h-full w-full object-contain" />
          ) : item.desc ? (
            <div className="box-border h-full w-full overflow-y-auto p-6 text-base leading-relaxed text-brown">{item.desc}</div>
          ) : (
            <img src={asset('/icons/logo2.png')} alt="" className="h-full w-full object-contain" />
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex h-[58px] flex-1 items-center rounded-[10px] border border-black bg-white px-4 text-base text-[#1C1C13]">
            {placeCity || '--'}
          </div>
          <div className="flex h-[58px] flex-1 items-center rounded-[10px] border border-black bg-white px-4 text-base text-[#1C1C13]">
            {placeRestText || '--'}
          </div>
        </div>

        <div className="flex h-[58px] w-full items-center justify-center rounded-[10px] border border-black bg-white px-4 text-base text-[#1C1C13]">
          {item.date}
        </div>

        <div className="flex h-[58px] w-full items-center rounded-[10px] border border-black bg-white px-4 text-base text-[#482B12]">
          {item.code}
        </div>

        {item.tags.length > 0 && (
          <div className="box-border w-full rounded-[10px] border border-black bg-card p-6">
            <div className="mb-3 text-xl font-semibold text-[#482B12]">標籤</div>
            <div className="flex flex-wrap gap-3">
              {item.tags.map((t) => (
                <div key={t} className="rounded-[10px] bg-white px-5 py-[10px] text-base text-[#482B12]">{t}</div>
              ))}
            </div>
          </div>
        )}

        {(status === LOST_STATUS.REVIEWING || reviewReason) && (
          <div className="box-border w-full rounded-[10px] bg-card p-6 text-base leading-relaxed text-brown">
            {status === LOST_STATUS.REVIEWING
              ? '協尋文審核中，通過後會由 DiuLa! 官方帳號發佈並通知你。'
              : `協尋文沒有通過審核${reviewReason ? `：${reviewReason}` : ''}，修改內容後可以再送一次。`}
          </div>
        )}

        {threadUrl && (
          <div className="flex h-[70px] w-full items-center gap-4 rounded-[10px] bg-card p-3">
            <img src={asset('/icons/threads.png')} alt="Threads" className="h-10 w-10 shrink-0 object-contain" />
            <a
              href={threadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-full min-w-0 flex-1 items-center justify-center rounded-[10px] bg-white text-sm text-black underline"
            >
              <span className="max-w-[calc(100%-20px)] truncate">{threadUrl}</span>
            </a>
            <button
              type="button"
              onClick={() => setDialog('deleteThread')}
              disabled={deletingThread}
              className="box-border h-full w-24 shrink-0 rounded-full border border-black bg-white text-base font-medium text-error disabled:opacity-60"
            >
              {deletingThread ? '刪除中' : '刪除'}
            </button>
          </div>
        )}

        {!found && (
          <button
            type="button"
            onClick={() => setDialog('confirm')}
            className="flex h-20 w-full items-center justify-center gap-3 rounded-full border border-black bg-blue text-xl text-brown transition hover:brightness-[.98]"
          >
            <CircleCheckIcon className="h-10 w-10 shrink-0" />
            我找到了！立即更新狀態
          </button>
        )}

        <button
          type="button"
          onClick={() => setDialog('delete')}
          className="h-12 w-[160px] self-center rounded-full border border-[#C4C4C4] bg-white text-sm font-bold text-[#C4C4C4]"
        >
          刪除此筆資料
        </button>
      </div>

      <DesktopFooter />
    </div>

    {dialog === 'confirm' && <ConfirmFoundModal busy={busy} onCancel={() => setDialog(null)} onConfirm={confirmFound} />}
      {dialog === 'delete' && <DeleteConfirmModal busy={busy} onCancel={() => setDialog(null)} onConfirm={deleteItem} />}
      {/* 刪除公開的 Threads 協尋文無法復原，先確認 */}
      {dialog === 'deleteThread' && (
        <DeleteThreadConfirmModal
          busy={deletingThread}
          onCancel={() => setDialog(null)}
          onConfirm={async () => { await deleteThreadPost(); setDialog(null) }}
        />
      )}
      {dialog === 'deleted' && <DeleteSuccessModal onConfirm={() => navigate('/my/lost', { replace: true })} />}
    </>
  )
}
