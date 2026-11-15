import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { findVisible, isSeen, loadSeen, markSeen } from '../lib/tours'

/**
 * 頁面內小提示（2026-11-16 開會定案）：咖啡色小泡泡指著某個區塊，畫面不變暗，
 * 只出現一次，按「知道了」就關掉、之後不再出現（紀錄記在帳號上，見 lib/tours.js）。
 *
 * props：
 *   name   ：看過紀錄的名字，例如 'tip_tags_find'
 *   anchor ：要指的元素的 data-tip 值（手機版、桌機版各放一份，會挑看得到的那個）
 *   show   ：條件成立才出現（例如「都沒有我的物品」按鈕浮出來之後）
 *   children：提示文字
 * 被指的元素不在畫面裡時先藏起來，等使用者捲到它附近才出現。
 */
const GAP = 12
const SIDE = 16

export default function OnceTip({ name, anchor, show = true, children }) {
  const { user } = useAuth()
  const uid = user?.uid
  const [done, setDone] = useState(true) // 帳號上的紀錄同步完才決定要不要出現
  const [pos, setPos] = useState(null)
  const tipRef = useRef(null)
  const active = show && !done && Boolean(uid)

  useEffect(() => {
    let cancelled = false
    loadSeen(uid).then((ok) => { if (!cancelled) setDone(!ok || isSeen(name, uid)) })
    return () => { cancelled = true }
  }, [name, uid])

  useEffect(() => {
    if (!active) { setPos(null); return }
    let raf = 0
    const update = () => {
      raf = 0
      const el = findVisible('data-tip', anchor)
      const tip = tipRef.current
      if (!el || !tip) { setPos(null); return }
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      // 被指的元素要有一半以上在畫面裡才顯示
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0) > Math.min(r.height, vh) / 2
      if (!visible) { setPos(null); return }
      const th = tip.offsetHeight
      const tw = tip.offsetWidth
      const below = r.bottom + GAP + th <= vh - 12
      const top = below ? r.bottom + GAP : Math.max(12, r.top - GAP - th)
      const left = Math.max(SIDE, (window.innerWidth - tw) / 2)
      const arrow = Math.max(24, Math.min(r.left + r.width / 2 - left, tw - 24))
      setPos({ top, below, arrow, ring: { left: r.left - 4, top: r.top - 4, width: r.width + 8, height: r.height + 8 } })
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update) }
    schedule()
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    const ro = new ResizeObserver(schedule)
    ro.observe(document.body)
    // 浮動按鈕淡入有 300ms 動畫，動畫結束再量一次
    const t = setTimeout(schedule, 350)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      clearTimeout(t)
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      ro.disconnect()
    }
  }, [active, anchor])

  if (!active) return null

  const close = () => {
    markSeen(name, uid)
    setDone(true)
  }

  return (
    <>
      {pos && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[95] rounded-[14px] border-2 border-dashed border-brown"
          style={{ ...pos.ring, borderRadius: anchor.startsWith('none') ? 50 : 14 }}
        />
      )}
      <div
        ref={tipRef}
        role="status"
        className="fixed z-[95] flex w-[calc(100%-32px)] max-w-[361px] flex-col gap-2 rounded-xl bg-brown px-4 py-3 text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
        style={{ top: pos ? pos.top : -9999, left: '50%', transform: 'translateX(-50%)', visibility: pos ? 'visible' : 'hidden' }}
      >
        {pos && (
          <span
            aria-hidden="true"
            className={`absolute h-3 w-3 -translate-x-1/2 rotate-45 bg-brown ${pos.below ? '-top-[5px]' : '-bottom-[5px]'}`}
            style={{ left: pos.arrow }}
          />
        )}
        <span className="text-xs tracking-wider opacity-70">小提示</span>
        <p className="text-sm leading-relaxed">{children}</p>
        <button
          type="button"
          onClick={close}
          className="self-end rounded-[50px] bg-card px-4 py-[6px] text-sm font-medium text-brown focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          知道了
        </button>
      </div>
    </>
  )
}
