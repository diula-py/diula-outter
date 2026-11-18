import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarIcon, LocationIcon, PersonChalkboardIcon, ChevronLeftIcon } from '../components/icons'
import { DeleteConfirmModal, DeleteSuccessModal } from '../components/DialogKit'
import { DetailHeader, DetailImage, InfoBox, InfoRow, TagsBox, DeleteButton } from '../components/DetailKit'
import DesktopTopNav from '../components/DesktopTopNav'
import DesktopFooter from '../components/DesktopFooter'
import { removeMyItem } from '../lib/items'
import { titleFromTags } from '../data/tagTaxonomy'
import { asset } from '../lib/asset'

export default function MyFoundDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const passed = location.state?.item

  const tags = passed?.tags && passed.tags.length ? passed.tags : []
  const item = {
    // 標題同遺失物：用標籤組成「顏色＋物品」（例如「灰色滑鼠」）。拾獲物存檔時沒存 name，
    // 所以這裡直接由標籤算；證件類只有一個證件別標籤，算出來就是證件別本身。
    name: titleFromTags(tags) || passed?.name || '拾獲物',
    code: passed?.id ? `＃${String(passed.id).toUpperCase()}` : '--', // 同遺失物詳情：＃文件 ID（大寫）
    date: (passed?.date || '').replaceAll('-', '/') || '—',
    // inner：「拾獲地點：…」「送往：…」，空值顯示「未知地點」；備註沒填改顯示描述
    // 詳細地點接在後面（舊資料沒有這兩欄就不接）
    place: `拾獲地點：${[passed?.place || '未知地點', passed?.location_detail].filter(Boolean).join(' ')}`,
    dropLocation: `送往：${[passed?.dropLocation || '未知地點', passed?.dropLocation_detail].filter(Boolean).join(' ')}`,
    remark: passed?.remark || passed?.desc || '--',
    tags,
    img: passed?.image || passed?.img || null,
  }

  const [dialog, setDialog] = useState(null) // null | 'delete' | 'deleted'
  const [busy, setBusy] = useState(false)

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
    <>
    {/* ======== 手機／手機橫放：維持原本版型，桌機（lg:）整個藏起來 ======== */}
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col items-center bg-paper pb-[100px] land:grid land:max-w-none land:grid-cols-[repeat(2,minmax(0,340px))] land:content-start land:items-start land:justify-center land:gap-x-7 land:gap-y-3 land:[grid-auto-flow:row_dense] land:pb-6 lg:hidden">
      {/* Header 109px：標題 top:70、返回鍵 35×35 在 (26,62)（page-19 比 page-16 高） */}
      <DetailHeader title={item.name} onBack={() => navigate(-1)} height={109} titleTop={70} backLeft={25} backTop={62} backSize={35} />

      {/* 編號徽章：同遺失物詳情的徽章樣式（高 30、藍底圓角 10、padding 0 15、16/400）。
          拾獲物只有「保管中」一種狀態、沒有狀態徽章，編號靠左、左緣對齊下方圖片框（這一排跟圖片框同寬）；
          一排只有它，16px 放得下完整編號 */}
      <div className="mt-5 flex h-[30px] w-[calc(100%-40px)] max-w-[340px] shrink-0 land:col-start-1 land:mt-0 land:w-full land:max-w-none">
        <span className="flex h-[30px] min-w-0 items-center overflow-hidden whitespace-nowrap rounded-[10px] bg-blue px-[15px] text-base font-normal leading-4">
          <span className="min-w-0 truncate">{item.code}</span>
        </span>
      </div>

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

      {/* 拾獲物沒有「我找到了」：失主找回不是拾獲者自己按的，拾獲物只有「保管中」一種狀態 */}
      {/* 刪除此筆資料（標籤區下方 20px） */}
      <DeleteButton onClick={() => setDialog('delete')} />
    </div>

    {/* ======== 桌機（lg:）：照 MyLostDetailPage 同款桌機骨架（這頁沒有 Figma 稿）——
        不動共用的 DetailKit，自己寫 768 置中欄，狀態/動作邏輯整頁共用。拾獲物沒有
        狀態徽章、沒有「我找到了」，地點資料是已經組好前綴的單一字串（拾獲地點：…／
        送往：…），所以不像 MyLostDetailPage 拆城市/其餘兩欄，整行放一個白框。 ======== */}
    <div className="hidden min-h-screen w-full flex-col items-center bg-paper lg:flex">
      <DesktopTopNav />

      <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-8 px-6 pb-16 pt-10 box-border">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} aria-label="返回" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center">
            <ChevronLeftIcon className="h-[30px] w-[30px] text-brown" />
          </button>
          <h1 className="m-0 max-w-[460px] truncate text-2xl font-normal text-brown">{item.name}</h1>
        </div>

        <div className="flex h-[300px] w-full items-center justify-center overflow-hidden rounded-lg border border-black bg-white">
          {item.img ? (
            <img src={item.img} alt="" className="h-full w-full object-contain" />
          ) : (
            <img src={asset('/icons/logo2.png')} alt="" className="h-full w-full object-contain" />
          )}
        </div>

        <div className="flex h-[58px] w-full items-center rounded-[10px] border border-black bg-white px-4 text-base text-brown">
          {item.date}
        </div>

        <div className="flex h-[58px] w-full items-center rounded-[10px] border border-black bg-white px-4 text-base text-brown">
          {item.place}
        </div>

        <div className="flex h-[58px] w-full items-center rounded-[10px] border border-black bg-white px-4 text-base text-brown">
          {item.dropLocation}
        </div>

        <div className="flex h-[58px] w-full items-center rounded-[10px] border border-black bg-white px-4 text-base text-brown">
          {item.code}
        </div>

        {item.remark && item.remark !== '--' && (
          <div className="box-border w-full rounded-[10px] bg-card p-6 text-base leading-relaxed text-brown">
            <div className="mb-2 text-xl font-semibold text-brown">備註</div>
            {item.remark}
          </div>
        )}

        {item.tags.length > 0 && (
          <div className="box-border w-full rounded-[10px] border border-black bg-card p-6">
            <div className="mb-3 text-xl font-semibold text-brown">標籤</div>
            <div className="flex flex-wrap gap-3">
              {item.tags.map((t) => (
                <div key={t} className="rounded-[10px] bg-white px-5 py-[10px] text-base text-brown">{t}</div>
              ))}
            </div>
          </div>
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

    {dialog === 'delete' && <DeleteConfirmModal busy={busy} onCancel={() => setDialog(null)} onConfirm={deleteItem} />}
    {dialog === 'deleted' && <DeleteSuccessModal onConfirm={() => navigate('/my/found', { replace: true })} />}
    </>
  )
}
