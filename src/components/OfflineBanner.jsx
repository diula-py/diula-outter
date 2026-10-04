import { useEffect, useState } from 'react'

// 離線提示：最上方固定一條淺藍底，恢復連線自動消失。
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
