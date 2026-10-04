import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * 換頁時捲回頂端。整個 App 共用同一個 window 捲動位置，不處理的話，
 * 從捲到一半的頁面點進下一頁，新頁面會直接是捲動過的狀態（標題被狀態列色帶蓋住）。
 * 返回上一頁（POP）不動，保留瀏覽器原本的捲動位置。
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    if (navType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navType])

  return null
}
