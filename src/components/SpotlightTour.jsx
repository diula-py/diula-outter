import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { findVisible } from '../lib/tours'

/**
 * 聚光燈導覽：畫面變暗，只亮出正在介紹的按鈕，旁邊用泡泡說明（「尋找／拾獲使用教學」，
 * 2026-11-16 開會定案的樣式，草稿見 https://claude.ai/artifact/AaBMNLHsdni16bpPwXN9mN）。
 *
 * steps：[{ targets: ['find-cross'], title, body }]
 *   targets 是畫面上元素的 data-tour 值；給兩個就兩顆按鈕一起亮。
 *   亮的範圍是按鈕的形狀（膠囊／圓形）再往外留一圈白邊（PAD），沒有框線（2026-11-16 使用者指定：
 *   不要虛線、也不要實線，但要留一點白邊）。
 *   畫面上找不到的步驟（例如桌機版沒有問號鈕）直接略過，進度「1 / N」也跟著少一步。
 * 泡泡：標題在上、進度在標題右側；按鈕比照 DialogButton（1px 黑框、圓角 50、咖啡色字）。
 */
const PAD = 6 // 亮區比按鈕大一圈，露出一點頁面底色當白邊
const GAP = 14 // 亮區和泡泡的距離
const SIDE = 16 // 泡泡離螢幕左右

const BTN = 'box-border h-11 shrink-0 rounded-[50px] border border-black px-5 text-base font-medium text-brown ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown'

function measure(targets) {
  const els = targets.map((id) => findVisible('data-tour', id)).filter(Boolean)
  if (els.length !== targets.length) return null
  const rs = els.map((el) => el.getBoundingClientRect())
  const left = Math.min(...rs.map((r) => r.left)) - PAD
  const top = Math.min(...rs.map((r) => r.top)) - PAD
  const right = Math.max(...rs.map((r) => r.right)) + PAD
  const bottom = Math.max(...rs.map((r) => r.bottom)) + PAD
  // 每顆按鈕各挖一個洞（外擴 PAD），圓角取短邊一半（膠囊按鈕、圓形問號鈕都對）
  const holes = rs.map((r) => {
    const w = r.width + PAD * 2
    const h = r.height + PAD * 2
    return { x: r.left - PAD, y: r.top - PAD, w, h, rx: Math.min(w, h) / 2 }
  })
  return { left, top, width: right - left, height: bottom - top, els, holes }
}

export default function SpotlightTour({ steps, label, onClose }) {
  // 只留畫面上真的找得到的步驟。要等頁面畫到畫面上之後才找得到按鈕，所以在 layout effect 裡算（null＝還沒算）
  const [list, setList] = useState(null)
  useLayoutEffect(() => {
    setList(steps.filter((s) => s.targets.every((id) => findVisible('data-tour', id))))
  }, [steps])
  const [cur, setCur] = useState(0)
  const [holes, setHoles] = useState(null)
  const [bubbleTop, setBubbleTop] = useState(null)
  const [below, setBelow] = useState(true)
  const [arrowX, setArrowX] = useState(0)
  const bubbleRef = useRef(null)
  const nextRef = useRef(null)
  const last = (list?.length ?? 0) - 1
  const step = list?.[cur]

  // 一個步驟都沒有（例如畫面上找不到任何按鈕）：直接當作看完
  useEffect(() => { if (list && list.length === 0) onClose() }, [list, onClose])

  // 教學開著時後面的頁面不能手動捲（程式捲動還是可以，用來把按鈕捲進畫面）
  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    return () => { html.style.overflow = prev }
  }, [])

  const place = useCallback(() => {
    if (!step) return
    const m = measure(step.targets)
    if (!m) return
    setHoles(m.holes)
    const br = bubbleRef.current?.getBoundingClientRect()
    const bh = br?.height || 0
    // 箭頭指向亮框中間（泡泡在寬螢幕會置中，所以用泡泡實際的左邊界換算）
    if (br) setArrowX(Math.max(28, Math.min(m.left + m.width / 2 - br.left, br.width - 28)))
    const vh = window.innerHeight
    const fitsBelow = m.top + m.height + GAP + bh <= vh - 12
    setBelow(fitsBelow)
    setBubbleTop(fitsBelow ? m.top + m.height + GAP : Math.max(12, m.top - GAP - bh))
  }, [step])

  // 換步驟：先把按鈕捲到畫面中間，再量位置
  useLayoutEffect(() => {
    if (!step) return
    const m = measure(step.targets)
    if (m) m.els[0].scrollIntoView({ block: 'center', inline: 'nearest' })
    place()
    const id = requestAnimationFrame(place) // 泡泡內容換了高度會變，下一幀再量一次
    return () => cancelAnimationFrame(id)
  }, [step, place])

  // 視窗大小或頁面內容變了（例如「加入官方帳號好友」提示卡晚一點才出現、把按鈕往下推）就重量
  useEffect(() => {
    window.addEventListener('resize', place)
    const ro = new ResizeObserver(() => place())
    ro.observe(document.body)
    return () => { window.removeEventListener('resize', place); ro.disconnect() }
  }, [place])

  useEffect(() => { nextRef.current?.focus({ preventScroll: true }) }, [cur])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!step) return null

  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-[998]">
      {/* 變暗的遮罩（同時擋住後面的點擊）：只在按鈕的位置挖空 */}
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="#fff" />
            {holes?.map((h, i) => <rect key={i} x={h.x} y={h.y} width={h.w} height={h.h} rx={h.rx} fill="#000" />)}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(30,20,10,0.62)" mask="url(#spotlight-mask)" />
      </svg>

      <div
        ref={bubbleRef}
        className="fixed mx-auto flex max-w-[361px] flex-col gap-[10px] rounded-[14px] bg-card px-4 pb-[14px] pt-4 text-brown shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
        style={{ left: SIDE, right: SIDE, top: bubbleTop ?? -9999 }}
      >
        <span
          aria-hidden="true"
          className={`absolute h-[14px] w-[14px] -translate-x-1/2 rotate-45 bg-card ${below ? '-top-[6px]' : '-bottom-[6px]'}`}
          style={{ left: arrowX }}
        />
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold leading-snug">{step.title}</h2>
          <span className="shrink-0 text-xs tracking-wider text-hint">{cur + 1} / {list.length}</span>
        </div>
        <div className="text-[15px] leading-relaxed text-[#6b5440]">{step.body}</div>
        <div className="mt-1 flex items-center gap-2">
          <button type="button" onClick={onClose} className="mr-auto px-1 py-2 text-sm text-hint">跳過</button>
          {cur > 0 && (
            <button type="button" onClick={() => setCur(cur - 1)} className={`${BTN} bg-white`}>上一步</button>
          )}
          <button ref={nextRef} type="button" onClick={() => (cur === last ? onClose() : setCur(cur + 1))} className={`${BTN} bg-blue`}>
            {cur === last ? '知道了' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  )
}
