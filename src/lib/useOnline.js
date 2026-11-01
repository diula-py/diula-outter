import { useEffect, useState } from 'react'

// 目前有沒有網路（navigator.onLine），斷線／恢復時自動更新。
// ⚠️ 只代表「有連上網路介面」：連到沒有對外網路的 Wi-Fi 時還是 true，真的要寫資料的地方別只靠它。
export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])
  return online
}
