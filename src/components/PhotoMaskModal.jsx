import { useEffect, useRef, useState } from 'react'

// 通用相片打碼：在圖上自由拖曳黑框遮住個資／路人臉，再輸出打碼後的 JPEG。
// 與 MaskingModal（證件專用、強制裁切＋依版型自動打碼）不同，這支給一般照片用，
// 純手動、可不打碼直接完成。
const MAX_SIDE = 1280 // 輸出上限邊長，控制檔案大小（Threads 抓大圖會逾時）

export default function PhotoMaskModal({ src, onCancel, onConfirm }) {
  const baseRef = useRef(null)      // 主 canvas：底圖 + 已確定的黑框
  const overlayRef = useRef(null)   // 疊層 canvas：正在拖曳的預覽框
  const baseDataRef = useRef(null)  // 乾淨底圖像素（重畫用）
  const masksRef = useRef([])       // 已畫的黑框（canvas 座標）
  const drawRef = useRef({ drawing: false, x: 0, y: 0 })
  const [count, setCount] = useState(0)

  // 載圖 → 依上限縮放畫進 canvas，存乾淨底圖像素供重畫。
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const main = baseRef.current
      const overlay = overlayRef.current
      if (!main || !overlay) return
      main.width = w; main.height = h
      overlay.width = w; overlay.height = h
      const ctx = main.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      baseDataRef.current = ctx.getImageData(0, 0, w, h)
    }
    img.src = src
  }, [src])

  function redraw() {
    const ctx = baseRef.current.getContext('2d')
    ctx.putImageData(baseDataRef.current, 0, 0)
    ctx.fillStyle = '#111'
    for (const m of masksRef.current) ctx.fillRect(m.x, m.y, m.w, m.h)
  }

  function posFrom(e) {
    const c = overlayRef.current
    const rect = c.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (c.width / rect.width),
      y: (e.clientY - rect.top) * (c.height / rect.height),
    }
  }
  function onDown(e) {
    e.preventDefault()
    const p = posFrom(e)
    drawRef.current = { drawing: true, x: p.x, y: p.y }
    overlayRef.current.setPointerCapture?.(e.pointerId)
  }
  function onMove(e) {
    if (!drawRef.current.drawing) return
    const p = posFrom(e)
    const o = overlayRef.current.getContext('2d')
    o.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height)
    o.fillStyle = 'rgba(17,17,17,0.5)'
    o.fillRect(drawRef.current.x, drawRef.current.y, p.x - drawRef.current.x, p.y - drawRef.current.y)
    o.strokeStyle = '#4A3728'
    o.lineWidth = 2
    o.strokeRect(drawRef.current.x, drawRef.current.y, p.x - drawRef.current.x, p.y - drawRef.current.y)
  }
  function onUp(e) {
    if (!drawRef.current.drawing) return
    drawRef.current.drawing = false
    const p = posFrom(e)
    const o = overlayRef.current.getContext('2d')
    o.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height)
    const w = p.x - drawRef.current.x
    const h = p.y - drawRef.current.y
    if (Math.abs(w) < 5 || Math.abs(h) < 5) return // 點一下不算，避免誤觸
    masksRef.current.push({ x: drawRef.current.x, y: drawRef.current.y, w, h })
    redraw()
    setCount(masksRef.current.length)
  }

  function undo() {
    if (!masksRef.current.length) return
    masksRef.current.pop(); redraw(); setCount(masksRef.current.length)
  }
  function clearAll() {
    masksRef.current = []; redraw(); setCount(0)
  }

  function done() {
    // 沒打碼也可完成（回傳等同原圖，只是縮到上限）。
    const url = baseRef.current.toDataURL('image/jpeg', 0.85)
    onConfirm(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-4">
      <div className="mx-auto flex max-h-full w-full max-w-[430px] flex-col overflow-hidden rounded-2xl bg-base">
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
          <button type="button" onClick={onCancel} className="text-sm text-brown">取消</button>
          <span className="text-base font-bold text-brown">為圖片打碼</span>
          <button type="button" onClick={done} className="text-sm font-semibold text-brown">完成</button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <p className="mb-2 text-xs text-brown/70">
            在照片上拖曳，框住要遮住的部分（路人臉、車牌、地址…）。可不打碼直接按「完成」。
          </p>
          <div className="relative overflow-hidden rounded-xl bg-black/5">
            <canvas ref={baseRef} className="block w-full" />
            <canvas
              ref={overlayRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              className="absolute inset-0 h-full w-full touch-none"
              style={{ cursor: 'crosshair' }}
            />
          </div>
          <p className={`mt-2 text-xs ${count ? 'text-brown/70' : 'text-brown/50'}`}>
            {count ? `已遮蔽 ${count} 個區域（可拖曳新增、↩ 上一步移除）` : '尚未遮蔽任何區域'}
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={undo} className="rounded-full border border-black bg-input px-4 py-1 text-sm text-brown">↩ 上一步</button>
            <button type="button" onClick={clearAll} className="rounded-full border border-black bg-input px-4 py-1 text-sm text-brown">清除</button>
          </div>
        </div>

        <div className="border-t border-black/10 p-4">
          <button type="button" onClick={done}
            className="h-12 w-full rounded-full border border-black bg-blue text-base font-medium text-brown">
            完成打碼，套用照片
          </button>
        </div>
      </div>
    </div>
  )
}
