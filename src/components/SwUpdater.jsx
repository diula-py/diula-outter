import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { applyPendingUpdate } from '../lib/pwa'

// 每次換頁檢查一次：如果有等待中的新版，而且已經離開登記／搜尋流程，就換上新版。見 lib/pwa.js。
export default function SwUpdater() {
  const { pathname } = useLocation()
  useEffect(() => {
    applyPendingUpdate()
  }, [pathname])
  return null
}
