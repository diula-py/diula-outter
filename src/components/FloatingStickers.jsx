import { useEffect, useRef } from 'react'
import { asset } from '../lib/asset'

/**
 * 背景漂浮貼紙（首頁、個人頁用）。2026-11-27 使用者給的動畫參數：
 *   mode rise（由下往上飄）、speed 1／speedVar 35%、sway 40px／swaySpeed 0.8、drift 140px、
 *   fade、rotMode swing ±30° rotSpeed 1、count 15、opacity 0.35、size 86／sizeVar 10%、
 *   blur 1.5px、area full、even 20%、overlap avoid（gap 34）、layer back、scroll fixed、seed 7。
 * 貼紙：umbrella／star／key／wallet／magnifier／bottle（public/stickers/）。參數裡的 starQ
 * 目前沒有素材，先略過；magnifierDark／smile 參數本來就是關的。
 *
 * 版面：fixed 鋪滿視窗、z-index -1、不吃點擊。AppLayout 外框有 `isolate`（自成一個疊層），
 * 所以 -1 會畫在外框白底之上、所有內容之下（layer back）：空白處看得到，卡片會蓋住它。
 * 頁面內容不用另外加 z-index，TabBar／彈窗的上下順序也都不受影響。
 * 手機寬度（< 768）縮小並減少數量，不然 393 寬塞 15 張 86px 太擠。
 * 使用者系統設定「減少動態效果」時只顯示靜止的貼紙，不跑動畫。
 */

const P = {
  speed: 1,
  speedVar: 0.35,
  sway: 40,
  swaySpeed: 0.8,
  drift: 140,
  rotAngle: 30,
  rotSpeed: 1,
  count: 15,
  opacity: 0.35,
  size: 86,
  sizeVar: 0.1,
  blur: 1.5,
  even: 0.2,
  gap: 34,
  seed: 7,
}
const BASE_RISE = 45 // speed 1 時每秒往上飄幾 px
const FADE_ZONE = 0.12 // 進出畫面那 12% 的路程淡入／淡出

const STICKERS = ['umbrella', 'star', 'key', 'wallet', 'magnifier', 'bottle']

// 固定 seed 的亂數（mulberry32），每次進頁面排列都一樣
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeItems(mobile) {
  const r = rng(P.seed)
  const count = mobile ? 8 : P.count
  const baseSize = mobile ? Math.round(P.size * 0.75) : P.size
  return Array.from({ length: count }, (_, i) => ({
    src: asset(`/stickers/${STICKERS[i % STICKERS.length]}.png`),
    // even：水平方向平均分成 count 格，每張在自己那格裡只偏移 ±even，不會全擠在同一側
    x: (i + 0.5 + (r() - 0.5) * 2 * P.even) / count,
    // overlap avoid：起始高度用黃金比例錯開，左右相鄰的兩格不會在同一個高度
    phase: (i * 0.618034) % 1,
    v: BASE_RISE * P.speed * (1 + (r() * 2 - 1) * P.speedVar),
    size: baseSize * (1 + (r() * 2 - 1) * P.sizeVar),
    swayPhase: r() * Math.PI * 2,
    rotPhase: r() * Math.PI * 2,
  }))
}

export default function FloatingStickers() {
  const wrapRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const mobile = window.innerWidth < 768
    const items = makeItems(mobile)
    const sway = mobile ? P.sway * 0.6 : P.sway
    const drift = mobile ? P.drift * 0.4 : P.drift

    const els = items.map((it) => {
      const img = document.createElement('img')
      img.src = it.src
      img.alt = ''
      img.draggable = false
      img.style.cssText = `position:absolute;left:0;top:0;width:${it.size}px;height:${it.size}px;object-fit:contain;filter:blur(${P.blur}px);will-change:transform,opacity;opacity:0`
      wrap.appendChild(img)
      return img
    })

    function place(t) {
      const W = wrap.clientWidth
      const H = wrap.clientHeight
      items.forEach((it, i) => {
        const travel = H + it.size * 2 + P.gap
        const p = (it.phase + (t * it.v) / travel) % 1
        const y = H + P.gap / 2 - p * travel
        const x = it.x * W - it.size / 2 + Math.sin(t * P.swaySpeed + it.swayPhase) * sway + (p - 0.5) * drift
        const rot = Math.sin(t * P.rotSpeed + it.rotPhase) * P.rotAngle
        const fade = Math.min(1, p / FADE_ZONE, (1 - p) / FADE_ZONE)
        els[i].style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg)`
        els[i].style.opacity = String(P.opacity * fade)
      })
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    if (reduce) {
      place(0)
    } else {
      const start = performance.now()
      const tick = (now) => {
        place((now - start) / 1000)
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    return () => {
      cancelAnimationFrame(raf)
      els.forEach((el) => el.remove())
    }
  }, [])

  return <div ref={wrapRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden" />
}
