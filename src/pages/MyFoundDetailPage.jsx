import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon, PersonChalkboardIcon, DiulaPinIcon } from '../components/icons'
import { ConfirmFoundModal } from '../components/DialogKit'
import { DetailHeader, DetailImage, InfoBox, InfoRow, TagsBox, ActionButton } from '../components/DetailKit'
import { updateMyItem } from '../lib/items'
import { FOUND_STATUS } from '../data/itemStatus'

export default function MyFoundDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const passed = location.state?.item

  const item = {
    name: passed?.name || '拾獲物',
    date: (passed?.date || '').replaceAll('-', '/') || '—',
    place: passed?.place || '—',
    dropLocation: passed?.dropLocation || '',   // 送往地點（保管地）
    remark: passed?.remark || '--',
    tags: passed?.tags && passed.tags.length ? passed.tags : [],
    img: passed?.image || passed?.img || null,
  }

  const [dialog, setDialog] = useState(null) // null | 'confirm' | 'success'
  const [done, setDone] = useState(passed?.status === FOUND_STATUS.FOUND)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col items-center bg-paper pb-[100px]">
      {/* Header 109px：標題 top:70、返回鍵 35×35 在 (26,62)（page-19 比 page-16 高） */}
      <DetailHeader title={item.name} onBack={() => navigate(-1)} height={109} titleTop={70} backLeft={25} backTop={62} backSize={35} />

      <DetailImage src={item.img} mt={20} fallback={<DiulaPinIcon className="h-20 w-20" />} />

      {/* 資訊卡 340×230：日期／拾獲地點／送往地點／備註（白色欄左緣 x=111，比 page-16 多 2px） */}
      <InfoBox height={230} mt={17}>
        <InfoRow icon={<CalendarIcon className="h-[35px] w-[35px]" />} iconTop={25} pillTop={22} pillLeft={84.5}>{item.date}</InfoRow>
        <InfoRow icon={<LocationIcon className="h-[35px] w-[35px]" />} iconTop={75} pillTop={72} pillLeft={84.5}>{item.place}</InfoRow>
        <InfoRow icon={<PersonChalkboardIcon className="h-[35px] w-[35px]" />} iconTop={125} pillTop={122} pillLeft={84.5}>{item.dropLocation || '—'}</InfoRow>
        <InfoRow text="備註" textTop={184} pillTop={172} pillLeft={84.5}>{item.remark}</InfoRow>
      </InfoBox>

      {item.tags.length > 0 && <TagsBox tags={item.tags} mt={10} />}

      {/* 我找到了（找到後隱藏） */}
      {!done && <ActionButton tone="card" onClick={() => setDialog('confirm')}>我找到了！立即更新狀態</ActionButton>}

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
