import { useNavigate } from 'react-router-dom'

/** 尚未實作的頁面佔位：顯示標題 + 返回鈕。之後由你或其他技術接上功能。 */
export default function PlaceholderPage({ title }) {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-base px-6 pt-[calc(env(safe-area-inset-top)+16px)] pb-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="self-start text-base font-medium text-brown
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
      >
        ← 返回
      </button>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-brown">{title}</h1>
        <p className="mt-3 text-sm text-brown/60">此頁面待接功能</p>
      </div>
    </div>
  )
}
