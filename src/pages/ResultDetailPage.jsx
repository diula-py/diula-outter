import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, CalendarIcon, LocationIcon, PersonChalkboardIcon, DiulaPinIcon } from '../components/icons'
import DesktopTopNav from '../components/DesktopTopNav'
import DesktopFooter from '../components/DesktopFooter'
import { itemTitle } from '../lib/text'
import { displayTags } from '../data/tagTaxonomy'

// 各來源官方遺失物查詢系統（點卡片詳情底部的按鈕連過去）。
const SOURCE_LINK = {
  npa: { label: '警政署拾得遺失物管理系統', url: 'https://op2.npa.gov.tw/NM107-512Client/OP01A01Q_01.jsp' },
  metro: { label: '台北捷運智慧客服', url: 'https://www.gov.taipei/News_Content.aspx?n=EEC70A4186D4C828&sms=87415A8B9CE81B16&s=609D08500F8C9D4C' },
  hsr: { label: '台灣高鐵遺失物查詢', url: 'https://www.thsrc.com.tw/ArticleContent/83cbc68f-d82a-4b6e-9540-82a885f8e512' },
}

const fmtDate = (s) => (s ? String(s).slice(0, 10).replaceAll('-', '/') : '')

function Placeholder() {
  return <DiulaPinIcon className="h-20 w-20" />
}

export default function ResultDetailPage() {
  const navigate = useNavigate()
  const item = useLocation().state?.item || {}

  const title = itemTitle(item) || '遺失物'
  const place = [item.city, item.district].filter(Boolean).join('') || item.holding_place || item.station || ''
  const isDiula = item.source === 'diula'
  // DiuLa! 拾獲物的詳細地點與送往（found_items 的 location_detail／dropLocation／dropLocation_detail，
  // 要 Flask /match 照原欄位名帶回來才有；舊資料沒有就不顯示）
  const diulaPlace = [place, item.location_detail].filter(Boolean).join(' ')
  const dropOff = [item.dropLocation, item.dropLocation_detail].filter(Boolean).join(' ')
  const link = SOURCE_LINK[item.source]
  // 後端 /match 回傳的標籤／顏色可能有簡體，顯示前轉繁體
  const tags = displayTags([...(item.free_tags || []), ...(item.color || [])])

  return (
    <>
    {/* ======== 手機／手機橫放：維持原本版型，桌機（lg:）整個藏起來 ======== */}
    {/* 沒有 AppLayout（無 TabBar），外框與底部留白自己處理 */}
    <div className="mx-auto min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] bg-paper pb-[calc(40px+env(safe-area-inset-bottom))] land:max-w-none md:max-w-[700px] lg:hidden">
      {/* Header */}
      <header className="safe-header relative rounded-b-[20px] bg-card [--header-h:80px] land:[--header-h:64px]">
        <div className="relative flex h-full items-center justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="返回"
            className="back-hit absolute left-[22px] top-1/2 -translate-y-1/2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            <ChevronLeftIcon className="h-[30px] w-[30px] text-brown" />
          </button>
          <h1 className="max-w-[240px] truncate text-xl font-bold text-brown">{title}</h1>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-[22px] pt-5 land:grid land:grid-cols-[repeat(2,minmax(0,340px))] land:content-start land:justify-center land:gap-x-7 land:gap-y-3 land:[grid-auto-flow:row_dense] land:px-5 land:pt-3 land:pb-6
      md:grid md:grid-cols-[repeat(2,minmax(0,340px))] md:content-start md:justify-center md:gap-x-7 md:gap-y-3 md:[grid-auto-flow:row_dense]">
        {/* 圖片 */}
        <div className="flex h-[200px] w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#e7e3d5] land:col-start-1 land:h-[150px] md:col-start-1">
          {item.image_ref && /^https?:\/\//.test(item.image_ref) ? (
            <img src={item.image_ref} alt="" className="h-full w-full object-cover" />
          ) : (
            <Placeholder />
          )}
        </div>

        {isDiula ? (
          <>
            {/* DiuLa! 自家資料：日期 / 拾獲地點 / 送往 / 備註 + 標籤 */}
            <div className="flex flex-col gap-2.5 rounded-[10px] bg-card p-4 land:col-start-2 md:col-start-2">
              <div className="flex items-center gap-3">
                <div className="flex w-[46px] shrink-0 items-center justify-center"><CalendarIcon className="h-[35px] w-[35px] text-navy" /></div>
                <div className="flex h-10 min-w-0 flex-1 items-center rounded-[10px] bg-white px-4 text-xs text-brown">{fmtDate(item.found_date)}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex w-[46px] shrink-0 items-center justify-center"><LocationIcon className="h-[35px] w-[35px] text-navy" /></div>
                <div className="flex h-10 min-w-0 flex-1 items-center rounded-[10px] bg-white px-4 text-xs text-brown">{diulaPlace || '--'}</div>
              </div>
              {dropOff && (
                <div className="flex items-center gap-3">
                  <div className="flex w-[46px] shrink-0 items-center justify-center"><PersonChalkboardIcon className="h-[35px] w-[35px] text-navy" /></div>
                  <div className="flex h-10 min-w-0 flex-1 items-center rounded-[10px] bg-white px-4 text-xs text-brown">送往：{dropOff}</div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex w-[46px] shrink-0 items-center justify-center"><span className="text-base text-brown">備註</span></div>
                <div className="flex h-10 min-w-0 flex-1 items-center rounded-[10px] bg-white px-4 text-xs text-brown">{item.holding_place || '--'}</div>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-col gap-3 rounded-[10px] bg-card p-5 land:col-start-2 md:col-start-2">
                <span className="text-base font-bold text-brown">標籤</span>
                <div className="flex flex-wrap gap-2.5">
                  {tags.map((t) => (
                    <span key={t} className="rounded-[50px] border border-black bg-blue px-4 py-1.5 text-xs text-brown">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 官方來源：日期 + 內文 */}
            <div className="flex flex-col gap-3 rounded-[10px] bg-card p-5 land:col-start-2 md:col-start-2">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="h-[35px] w-[35px] text-navy" />
                <span className="text-base text-brown">{fmtDate(item.found_date)}</span>
              </div>
              <span className="text-base font-medium text-brown">內文</span>
              <div className="min-h-[110px] whitespace-pre-wrap rounded-[10px] bg-white p-4 text-sm leading-normal text-brown">
                {item.description || '（無內文）'}
                {place && `\n\n地點：${place}`}
                {(item.holding_place || item.station) && `\n保管地：${item.holding_place || item.station}`}
              </div>
            </div>

            {/* 前往該來源官方查詢系統 */}
            {link && (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[56px] w-full items-center justify-center rounded-[50px] border border-black bg-card land:col-span-full land:max-w-[350px] land:justify-self-center md:col-span-full md:max-w-[350px] md:justify-self-center
                           px-6 text-center text-base font-medium text-brown no-underline transition hover:bg-[#eee8d7]
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
              >
                {link.label}
              </a>
            )}
          </>
        )}
      </div>
    </div>

    {/* ======== 桌機（lg:）：照 2026-11 Figma「遺失物詳情」CSS，768 置中欄＋純文字方框
        （不是互動表單，所以地點/日期/備註都只是純顯示用的方框，不是輸入框）。
        CSS 只畫了 DiuLa! 自家資料那個分支（地點拆兩個方框＋標籤卡），官方來源那支
        （npa/metro/hsr，有內文＋外部連結按鈕）沒有設計稿，照同一套方框語言延伸。
        標題沿用手機版用品名（itemTitle），CSS 裡寫的「尋找遺失物」應該又是從同一個
        畫框複製忘記改。 ======== */}
    <div className="hidden min-h-screen w-full flex-col items-center bg-paper lg:flex">
      <DesktopTopNav />

      <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col gap-10 px-6 pb-16 pt-10 box-border">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} aria-label="返回" className="flex h-[30px] w-[30px] shrink-0 items-center justify-center">
            <ChevronLeftIcon className="h-[30px] w-[30px] text-brown" />
          </button>
          <h1 className="m-0 max-w-[600px] truncate text-2xl font-normal text-brown">{title}</h1>
        </div>

        <div className="flex h-[300px] w-full items-center justify-center overflow-hidden rounded-lg border border-black bg-white">
          {item.image_ref && /^https?:\/\//.test(item.image_ref) ? (
            <img src={item.image_ref} alt="" className="h-full w-full object-contain" />
          ) : (
            <Placeholder />
          )}
        </div>

        {isDiula ? (
          <>
            <div className="flex gap-4">
              <div className="flex h-[58px] flex-1 items-center rounded-[10px] border border-black bg-white px-4 text-base text-brown">
                {item.city || '--'}
              </div>
              <div className="flex h-[58px] flex-1 items-center rounded-[10px] border border-black bg-white px-4 text-base text-brown">
                {item.district || '--'}
              </div>
            </div>

            <div className="flex h-[58px] w-full items-center justify-center rounded-[10px] border border-black bg-white px-4 text-base text-brown">
              {fmtDate(item.found_date) || '--'}
            </div>

            <div className="min-h-[58px] w-full rounded-lg border border-black bg-white p-4 text-base text-brown">
              {dropOff ? `送往：${dropOff}` : (item.holding_place || '--')}
            </div>

            {tags.length > 0 && (
              <div className="box-border w-full rounded-[10px] border border-black bg-card p-6">
                <div className="mb-3 text-xl font-semibold text-brown">標籤</div>
                <div className="flex flex-wrap gap-3">
                  {tags.map((t) => (
                    <span key={t} className="rounded-[10px] border border-black bg-blue px-5 py-[10px] text-base text-brown">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 跟手機版一樣整塊包在米色卡片裡（日期＋「內文」標籤＋內文框），
                不然像現在這樣只有白底方框，整頁很白。 */}
            <div className="flex flex-col gap-4 rounded-lg bg-card p-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-8 w-8 shrink-0 text-navy" />
                <span className="text-base text-brown">{fmtDate(item.found_date)}</span>
              </div>
              <span className="text-base font-medium text-brown">內文</span>
              <div className="min-h-[200px] whitespace-pre-wrap rounded-lg bg-white p-6 text-base leading-relaxed text-brown">
                {item.description || '（無內文）'}
                {place && `\n\n地點：${place}`}
                {(item.holding_place || item.station) && `\n保管地：${item.holding_place || item.station}`}
              </div>
            </div>

            {link && (
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[70px] w-full items-center justify-center rounded-full border-2 border-black bg-card text-lg font-medium text-brown no-underline transition hover:brightness-[.98]"
              >
                {link.label}
              </a>
            )}
          </>
        )}
      </div>

      <DesktopFooter />
    </div>
    </>
  )
}
