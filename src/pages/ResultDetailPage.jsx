import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, CalendarIcon, LocationIcon } from '../components/icons'

// 各來源官方遺失物查詢系統（點卡片詳情底部的按鈕連過去）。
const SOURCE_LINK = {
  npa: { label: '警政署拾得遺失物管理系統', url: 'https://op2.npa.gov.tw/NM107-512Client/OP01A01Q_01.jsp' },
  metro: { label: '台北捷運智慧客服', url: 'https://www.gov.taipei/News_Content.aspx?n=EEC70A4186D4C828&sms=87415A8B9CE81B16&s=609D08500F8C9D4C' },
  hsr: { label: '台鐵高鐵遺失物查詢', url: 'https://www.thsrc.com.tw/ArticleContent/83cbc68f-d82a-4b6e-9540-82a885f8e512' },
}

const fmtDate = (s) => (s ? String(s).slice(0, 10).replaceAll('-', '/') : '')

function Placeholder() {
  return (
    <svg viewBox="0 0 24 24" className="h-14 w-14 text-brown/30" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.1 2 5 5.1 5 9c0 5 7 13 7 13s7-8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
    </svg>
  )
}

export default function ResultDetailPage() {
  const navigate = useNavigate()
  const item = useLocation().state?.item || {}

  const title = item.description || item.free_tags?.[0] || '遺失物'
  const place = [item.city, item.district].filter(Boolean).join('') || item.holding_place || item.station || ''
  const isDiula = item.source === 'diula'
  const link = SOURCE_LINK[item.source]
  const tags = [...(item.free_tags || []), ...(item.color || [])]

  return (
    <div>
      {/* Header */}
      <header className="relative flex h-20 items-center justify-center rounded-b-[20px] bg-card pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="absolute left-[22px] top-1/2 -translate-y-1/2 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          <ChevronLeftIcon className="h-[26px] w-[26px] text-brown" />
        </button>
        <h1 className="max-w-[240px] truncate text-xl font-bold text-brown">{title}</h1>
      </header>

      <div className="flex flex-col gap-5 px-[22px] pt-5">
        {/* 圖片 */}
        <div className="flex h-[200px] w-full items-center justify-center overflow-hidden rounded-[10px] bg-[#e7e3d5]">
          {item.image_ref && /^https?:\/\//.test(item.image_ref) ? (
            <img src={item.image_ref} alt="" className="h-full w-full object-cover" />
          ) : (
            <Placeholder />
          )}
        </div>

        {isDiula ? (
          <>
            {/* DiuLa! 自家資料：日期 / 地點 / 備註 + AI 標籤 */}
            <div className="flex flex-col gap-2.5 rounded-[10px] bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex w-[46px] shrink-0 items-center justify-center"><CalendarIcon className="h-[28px] w-[28px] text-navy" /></div>
                <div className="flex h-10 min-w-0 flex-1 items-center rounded-[10px] bg-white px-4 text-xs text-brown">{fmtDate(item.found_date)}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex w-[46px] shrink-0 items-center justify-center"><LocationIcon className="h-[28px] w-[24px] text-navy" /></div>
                <div className="flex h-10 min-w-0 flex-1 items-center rounded-[10px] bg-white px-4 text-xs text-brown">{place || '--'}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex w-[46px] shrink-0 items-center justify-center"><span className="text-base text-brown">備註</span></div>
                <div className="flex h-10 min-w-0 flex-1 items-center rounded-[10px] bg-white px-4 text-xs text-brown">{item.holding_place || '--'}</div>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-col gap-3 rounded-[10px] bg-card p-5">
                <span className="text-base font-semibold text-brown">AI 標籤</span>
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
            <div className="flex flex-col gap-3 rounded-[10px] bg-card p-5">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="h-[28px] w-[28px] text-navy" />
                <span className="text-base text-brown">{fmtDate(item.found_date)}</span>
              </div>
              <span className="text-base font-medium text-brown">內文</span>
              <div className="min-h-[110px] whitespace-pre-wrap rounded-[10px] bg-white p-4 text-sm leading-relaxed text-brown">
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
                className="flex h-[56px] w-full items-center justify-center rounded-[50px] border border-black bg-card
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
  )
}
