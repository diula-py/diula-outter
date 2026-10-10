import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * 換頁時的捲動位置（整個 App 共用同一個 window 捲動位置）：
 * - 前往新頁面（PUSH／REPLACE）→ 捲回頂端。不處理的話，從捲到一半的頁面點進下一頁，
 *   新頁面會直接是捲動過的狀態（標題被狀態列色帶蓋住）。
 * - 返回上一頁（POP）→ 捲回這一頁上次的位置。由我們自己還原，不交給瀏覽器：
 *   瀏覽器會在返回的當下就還原，那時清單常常還沒畫出來、頁面太短，
 *   iOS 會捲到內容外面、留一大塊白色沒畫，要再滑一下才出現。
 *   這裡等頁面畫好才捲；內容還不夠高（資料還在載）就每個 frame 再試，最多 1 秒。
 */
const positions = new Map() // location.key → 離開時的 scrollY

export default function ScrollToTop() {
  const location = useLocation()
  const navType = useNavigationType()
  const keyRef = useRef(location.key)

  // 自己還原，不讓瀏覽器在內容還沒畫出來前就搶先還原
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  // 隨時記下目前這一頁捲到哪裡（離開時就是最後的位置）
  useEffect(() => {
    const save = () => positions.set(keyRef.current, window.scrollY)
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [])

  useLayoutEffect(() => {
    // 先換成新頁面的 key，再捲動：之後的捲動事件才會記到新頁面，不會把上一頁記住的位置蓋成 0
    keyRef.current = location.key
    if (navType !== 'POP') {
      window.scrollTo(0, 0)
      return
    }
    const target = positions.get(location.key) || 0
    if (!target) {
      window.scrollTo(0, 0)
      return
    }
    let frame = 0
    const start = performance.now()
    const tryRestore = () => {
      window.scrollTo(0, target)
      const reached = Math.abs(window.scrollY - target) < 2
      if (!reached && performance.now() - start < 1000) frame = requestAnimationFrame(tryRestore)
    }
    tryRestore()
    return () => cancelAnimationFrame(frame)
  }, [location.key, navType])

  return null
}
