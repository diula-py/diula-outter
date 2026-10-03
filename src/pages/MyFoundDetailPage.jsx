import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon, PersonChalkboardIcon } from '../components/icons'
import { ConfirmFoundModal, DeleteConfirmModal, DeleteSuccessModal } from '../components/DialogKit'
import { DetailHeader, DetailImage, InfoBox, InfoRow, TagsBox, ActionButton, DeleteButton } from '../components/DetailKit'
import { updateMyItem, removeMyItem } from '../lib/items'
import { FOUND_STATUS } from '../data/itemStatus'

export default function MyFoundDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const passed = location.state?.item

  const item = {
    name: passed?.name || '拾獲物',
    date: (passed?.date || '').replaceAll('-', '/') || '—',
    // inner：「拾獲地點：…」「送往：…」，空值顯示「未知地點」；備註沒填改顯示描述
    place: `拾獲地點：${passed?.place || '未知地點'}`,
    dropLocation: `送往：${passed?.dropLocation || '未知地點'}`,
    remark: passed?.remark || passed?.desc || '--',
    tags: passed?.tags && passed.tags.length ? passed.tags : [],
    img: passed?.image || passed?.img || null,
  }

  const [dialog, setDialog] = useState(null) // null | 'confirm' | 'delete' | 'deleted'
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(passed?.status === FOUND_STATUS.FOUND)

  // 刪除此筆資料：刪 Firestore 文件 → 「該筆資料已被刪除！」→ 確認後回列表。
  async function deleteItem() {
    setBusy(true)
    try {
      if (passed?.id) await removeMyItem('found', passed.id)
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
      {/* Header 109px：標題 top:70、返回鍵 35×35 在 (26,62)（page-19 比 page-16 高） */}
      <DetailHeader title={item.name} onBack={() => navigate(-1)} height={109} titleTop={70} backLeft={25} backTop={62} backSize={35} />

      {/* 沒照片：inner 直接顯示撐滿的 Logo（不顯示描述） */}
      <DetailImage src={item.img} mt={20} />

      {/* 資訊卡 340×230：日期／拾獲地點／送往地點／備註（白色欄左緣 x=111，比 page-16 多 2px） */}
      <InfoBox height={230} mt={17}>
        <InfoRow icon={<CalendarIcon className="h-[35px] w-[35px]" />} iconTop={25} pillTop={22} pillLeft={84.5}>{item.date}</InfoRow>
        <InfoRow icon={<LocationIcon className="h-[35px] w-[35px]" />} iconTop={75} pillTop={72} pillLeft={84.5}>{item.place}</InfoRow>
        <InfoRow icon={<PersonChalkboardIcon className="h-[35px] w-[35px]" />} iconTop={125} pillTop={122} pillLeft={84.5}>{item.dropLocation}</InfoRow>
        <InfoRow text="備註" textTop={184} pillTop={172} pillLeft={84.5}>{item.remark}</InfoRow>
      </InfoBox>

      {item.tags.length > 0 && <TagsBox tags={item.tags} mt={10} />}

      {/* 我找到了（找到後隱藏） */}
      {!done && <ActionButton tone="card" onClick={() => setDialog('confirm')}>我找到了！立即更新狀態</ActionButton>}

      {/* 刪除此筆資料（inner：我找到了鈕下方 20px） */}
      <DeleteButton onClick={() => setDialog('delete')} />

      {dialog === 'delete' && <DeleteConfirmModal busy={busy} onCancel={() => setDialog(null)} onConfirm={deleteItem} />}
      {dialog === 'deleted' && <DeleteSuccessModal onConfirm={() => navigate('/my/found', { replace: true })} />}
      {dialog === 'confirm' && (
        <ConfirmFoundModal
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            if (passed?.id) updateMyItem('found', passed.id, { status: FOUND_STATUS.FOUND })
            setDone(true)
            setDialog(null)
            navigate('/my/found', { replace: true })
          }}
        />
      )}
    </div>
  )
}
