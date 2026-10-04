import { useEffect, useState } from 'react'

// 離線提示：最上方固定一條淺藍底，恢復連線自動消失。
// 高度 = safe-area + 24px（上下 6px + 12px 字）；24px 要跟 index.css 的 --offline-bar-h 一致。
// 離線時畫面上的協尋資料／Threads 貼文都是 Firestore 快取或 SW 快取裡的舊資料。
export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => !navigator.onLine)

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  // 離線時整頁往下推一行（index.css 的 html.is-offline #root），提示條才不會壓到各頁標題列。
  useEffect(() => {
    document.documentElement.classList.toggle('is-offline', offline)
  }, [offline])

  if (!offline) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-[393px] bg-blue pt-[calc(6px+env(safe-area-inset-top))] pb-[6px] text-center text-xs text-brown"
    >
      目前離線，顯示的是先前載入的資料
    </div>
  )
}
