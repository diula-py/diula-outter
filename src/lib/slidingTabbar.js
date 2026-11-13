/**
 * 底部導覽列的滑動膠囊 + 長按拖曳（2026-11 PM 範例 diula-tabbar-snippet 移植）。
 *
 * 不經過 React state：膠囊位置每一格都由彈簧動畫直接寫進 style.transform，
 * 拖曳中的「拿起來」「經過的圖示」用 data-* 屬性標記（React 不會覆蓋它沒設定的屬性）。
 *
 * - nav：導覽列外框（要是 position: relative，膠囊相對它定位）
 * - pill：白色膠囊（pointer-events: none，事件交給 nav 判斷）
 * - items：三個分頁連結
 * - onSelect(i)：使用者用拖曳選了分頁 i（要切頁就在這裡 navigate）
 *
 * 回傳 { setIndex(i, animate), destroy() }：路由變了（點按連結、上一頁）就呼叫 setIndex 讓膠囊滑過去。
 */
export function createSlidingTabbar(nav, pill, items, index, options) {
  const opts = Object.assign({
    longPressMs: 280,     // 長按多久才能拖曳
    moveTolerance: 8,     // 長按判定前手指可移動的距離(px)
    rubberBand: 22,       // 拖出邊界時最多再拉多遠(px)
    stretch: true,        // 移動時膠囊依速度輕微拉長
    onSelect: () => {},
  }, options || {})

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  // 彈簧參數：SNAP = 點按/放開後滑過去；FOLLOW = 拖曳時緊跟手指
  const SNAP = { k: 520, c: 34 }
  const FOLLOW = { k: 1500, c: 76 }
  let spring = SNAP

  let slots = []
  let x = 0, v = 0, target = 0
  let lift = 1, liftTarget = 1
  let raf = 0, lastFrame = 0
  let press = null
  let hoverIndex = -1
  let suppressClickUntil = 0

  /* ---------- 量測每一格膠囊應停的位置（相對 nav 左緣，不受 transform 影響） ---------- */
  function measure() {
    const pw = pill.offsetWidth
    slots = items.map((el) => el.offsetLeft + el.offsetWidth / 2 - pw / 2)
  }

  /* ---------- 畫面更新 ---------- */
  function render() {
    let sx = lift, sy = lift
    if (opts.stretch && !reduceMotion.matches) {
      const s = Math.min(Math.abs(v) / 3200, 0.14)
      sx *= 1 + s
      sy *= 1 - s * 0.45
    }
    pill.style.transform =
      'translate3d(' + x.toFixed(2) + 'px,0,0) scale(' + sx.toFixed(4) + ',' + sy.toFixed(4) + ')'
  }

  /* ---------- 彈簧動畫迴圈 ---------- */
  function tick(now) {
    let dt = (now - lastFrame) / 1000
    lastFrame = now
    if (dt > 0.032) dt = 0.032

    const steps = 4, h = dt / steps
    for (let i = 0; i < steps; i++) {
      const a = -spring.k * (x - target) - spring.c * v
      v += a * h
      x += v * h
    }
    lift += (liftTarget - lift) * (1 - Math.exp(-dt * 22))
    render()

    const settled = Math.abs(x - target) < 0.2 && Math.abs(v) < 4 &&
                    Math.abs(lift - liftTarget) < 0.0015
    if (settled) {
      x = target; v = 0; lift = liftTarget
      render()
      raf = 0
      return
    }
    raf = requestAnimationFrame(tick)
  }

  function kick() {
    if (reduceMotion.matches) {
      x = target; v = 0; lift = liftTarget
      render()
      return
    }
    if (!raf) {
      lastFrame = performance.now()
      raf = requestAnimationFrame(tick)
    }
  }

  /* ---------- 切換分頁（膠囊滑過去） ---------- */
  function setIndex(i, animate = true) {
    index = i
    pill.style.visibility = i < 0 ? 'hidden' : ''
    if (i < 0 || !slots.length) return
    spring = SNAP
    target = slots[i]
    if (!animate) { x = target; v = 0; render(); return }
    kick()
  }

  function nearestSlot(px) {
    let best = 0, dist = Infinity
    slots.forEach((s, i) => {
      const d = Math.abs(s - px)
      if (d < dist) { dist = d; best = i }
    })
    return best
  }

  function setHover(i) {
    if (i === hoverIndex) return
    if (hoverIndex !== -1 && i !== -1 && navigator.vibrate) navigator.vibrate(6)
    hoverIndex = i
    items.forEach((el, j) => {
      if (j === i) el.dataset.hover = ''
      else delete el.dataset.hover
    })
  }

  // 拖出左右邊界時的橡皮筋阻力
  function rubber(raw) {
    const min = slots[0], max = slots[slots.length - 1], L = opts.rubberBand
    if (raw < min) { const d = min - raw; return min - (d * 0.55 * L) / (L + d * 0.55) }
    if (raw > max) { const d = raw - max; return max + (d * 0.55 * L) / (L + d * 0.55) }
    return raw
  }

  /* ---------- 長按 → 拖曳 ---------- */
  function onPill(e) {
    if (index < 0) return false
    const r = pill.getBoundingClientRect()
    return e.clientX >= r.left && e.clientX <= r.right &&
           e.clientY >= r.top - 6 && e.clientY <= r.bottom + 6
  }

  function startDrag() {
    if (!press) return
    press.dragging = true
    press.anchorX = press.curX   // 從目前手指位置開始算，避免跳動
    press.baseX = x
    press.lastX = press.curX
    press.lastT = performance.now()
    press.vel = 0
    try { nav.setPointerCapture(press.id) } catch { /* 指標已放開 */ }
    spring = FOLLOW
    liftTarget = 1.1
    pill.dataset.lifted = ''
    nav.dataset.dragging = ''
    setHover(nearestSlot(x))
    if (navigator.vibrate) navigator.vibrate(12)
    kick()
  }

  function cancelPress() {
    clearTimeout(press.timer)
    press = null
    liftTarget = 1
    kick()
  }

  function endPress(e, cancelled) {
    if (!press || e.pointerId !== press.id) return
    clearTimeout(press.timer)
    const p = press
    press = null
    liftTarget = 1

    if (p.dragging) {
      delete pill.dataset.lifted
      delete nav.dataset.dragging
      setHover(-1)
      try { nav.releasePointerCapture(p.id) } catch { /* 已釋放 */ }
      suppressClickUntil = performance.now() + 350

      // 若最後一次移動已超過 80ms，就當作手指停住（不甩出去）
      const vel = (performance.now() - p.lastT > 80) ? 0 : p.vel
      // 依放開時的速度預測落點 → 甩一下也能換到下一格
      const projected = cancelled ? x : x + vel * 0.12
      const i = nearestSlot(projected)
      const prev = index
      setIndex(i)
      if (i !== prev) opts.onSelect(i)
    } else {
      kick()
    }
  }

  function onPointerDown(e) {
    if (press) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (!onPill(e)) return
    press = {
      id: e.pointerId,
      startX: e.clientX, startY: e.clientY, curX: e.clientX,
      dragging: false, timer: 0,
    }
    liftTarget = 0.96            // 按下去先微微縮小，回饋「準備拿起」
    kick()
    press.timer = setTimeout(startDrag, opts.longPressMs)
  }

  function onPointerMove(e) {
    if (!press || e.pointerId !== press.id) return
    press.curX = e.clientX

    if (!press.dragging) {
      const moved = Math.hypot(e.clientX - press.startX, e.clientY - press.startY)
      if (moved > opts.moveTolerance) cancelPress()   // 長按前就移動 → 取消長按
      return
    }

    e.preventDefault()
    const now = performance.now()
    const dt = now - press.lastT
    if (dt > 0) {
      const inst = (e.clientX - press.lastX) / dt * 1000
      press.vel = press.vel * 0.6 + inst * 0.4
    }
    press.lastX = e.clientX
    press.lastT = now

    target = rubber(press.baseX + (e.clientX - press.anchorX))
    setHover(nearestSlot(target))
    kick()
  }

  const onPointerUp = (e) => endPress(e, false)
  const onPointerCancel = (e) => endPress(e, true)
  function onLostCapture(e) {
    if (press && press.dragging && e.pointerId === press.id) endPress(e, true)
  }
  function onPointerLeave(e) {   // 還沒進入拖曳就離開導覽列 → 取消
    if (press && !press.dragging && e.pointerId === press.id) cancelPress()
  }
  const onContextMenu = (e) => e.preventDefault()
  // 拖曳放開後瀏覽器可能補一個 click 到底下的連結：擋掉，切頁交給 onSelect
  function onClickCapture(e) {
    if (performance.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation() }
  }
  // 方向鍵左右切換分頁
  function onKeyDown(e) {
    const i = items.indexOf(e.target)
    if (i === -1) return
    let n = -1
    if (e.key === 'ArrowRight') n = Math.min(items.length - 1, i + 1)
    if (e.key === 'ArrowLeft') n = Math.max(0, i - 1)
    if (n === -1) return
    e.preventDefault()
    items[n].focus()
    if (n !== index) { setIndex(n); opts.onSelect(n) }
  }

  nav.addEventListener('pointerdown', onPointerDown)
  nav.addEventListener('pointermove', onPointerMove)
  nav.addEventListener('pointerup', onPointerUp)
  nav.addEventListener('pointercancel', onPointerCancel)
  nav.addEventListener('lostpointercapture', onLostCapture)
  nav.addEventListener('pointerleave', onPointerLeave)
  nav.addEventListener('contextmenu', onContextMenu)
  nav.addEventListener('click', onClickCapture, true)
  nav.addEventListener('keydown', onKeyDown)

  /* ---------- 初始化 + 尺寸改變時重新量測 ---------- */
  function relayout() {
    measure()
    if (!slots.length || index < 0) { setIndex(index, false); return }
    target = slots[index]
    if (!press) { x = target; v = 0 }
    render()
  }
  relayout()
  setIndex(index, false)
  const ro = window.ResizeObserver ? new ResizeObserver(relayout) : null
  if (ro) ro.observe(nav)
  else window.addEventListener('resize', relayout)

  function destroy() {
    if (raf) cancelAnimationFrame(raf)
    if (press) clearTimeout(press.timer)
    if (ro) ro.disconnect()
    else window.removeEventListener('resize', relayout)
    nav.removeEventListener('pointerdown', onPointerDown)
    nav.removeEventListener('pointermove', onPointerMove)
    nav.removeEventListener('pointerup', onPointerUp)
    nav.removeEventListener('pointercancel', onPointerCancel)
    nav.removeEventListener('lostpointercapture', onLostCapture)
    nav.removeEventListener('pointerleave', onPointerLeave)
    nav.removeEventListener('contextmenu', onContextMenu)
    nav.removeEventListener('click', onClickCapture, true)
    nav.removeEventListener('keydown', onKeyDown)
  }

  return { setIndex, destroy }
}
