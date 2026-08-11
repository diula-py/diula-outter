import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, CalendarIcon, LocationIcon, CircleCheckIcon } from '../components/icons'
import { updateItem } from '../lib/myItems'

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="3" strokeLinecap="round" {...props}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  )
}

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
  const [done, setDone] = useState(passed?.status === '已找到')

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
            // 送往地點：有值才顯示（拾獲物才有；協尋物沒有這欄）
            ...(item.dropLocation
              ? [{ icon: <LocationIcon className="h-[30px] w-[26px] text-navy" />, val: item.dropLocation }]
              : []),
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

        {/* 我找到了（找到後隱藏） */}
        {!done && (
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
                onClick={() => {
                  if (passed?.id) updateItem(passed.id, { status: '已找到' })
                  setDone(true)
                  setDialog(null)
                }}
                className="h-[52px] w-[200px] rounded-[50px] border border-black bg-blue text-base font-medium text-brown"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
