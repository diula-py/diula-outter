import { useLocation, useNavigate } from 'react-router-dom'
import { CircleCheckIcon } from '../components/icons'

/**
 * 登錄成功頁（inner page-13）：內容照 inner——打勾圖、「登錄成功！」、編號、
 * 「前往我的拾獲物」文字連結、底部「返回首頁」；樣式改套 design.md
 * （主棕色圖示與文字、50px 膠囊按鈕、1px 黑框），不用 inner 舊版的 LINE 綠與通用按鈕。
 * inner 的「前往我的拾獲物」實際是跳個人頁，這裡直接到「我的拾獲物」列表。
 */
export default function RegisterSuccessPage() {
  const navigate = useNavigate()
  const id = useLocation().state?.id

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col items-center bg-paper px-[22px] pb-[40px] text-brown">
      <div className="flex w-full flex-1 flex-col items-center justify-center text-center">
        <CircleCheckIcon className="mb-6 h-[120px] w-[120px]" />
        <h1 className="mb-4 text-xl font-bold leading-5">登錄成功！</h1>
        {id && <div className="mb-6 text-xl font-bold leading-5">＃{String(id).toUpperCase()}</div>}
        <button
          type="button"
          onClick={() => navigate('/my/found', { replace: true })}
          className="text-base font-medium leading-4 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          前往我的拾獲物
        </button>
      </div>

      <button
        type="button"
        onClick={() => navigate('/', { replace: true })}
        className="box-border flex h-[60px] w-full max-w-[350px] shrink-0 items-center justify-center rounded-[50px] border border-black bg-blue text-base font-medium
                   transition hover:brightness-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
      >
        返回首頁
      </button>
    </div>
  )
}
