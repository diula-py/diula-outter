import { useEffect, useRef, useState } from 'react'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

const MAX_IMAGE_CHARS = 900000 // 與後端 IdCardController 上限一致
const ID_RATIO = 85.6 / 54     // 證件實體長寬比（身分證/健保卡裁切鎖此比例）

// 各證件固定打碼區域：x/y 左上角、w/h 寬高，皆為 0~1 比例（相對裁切後圖片）。
// 由原 id_masking.html 的 MASK_REGIONS 移植。
const MASK_REGIONS = {
  national_id: [
    { x: 0.65, y: 0.0, w: 0.3, h: 1.0 },
    { x: 0.25, y: 0.45, w: 0.18, h: 0.2 },
  ],
  health_card: [
    { x: 0.62, y: 0.33, w: 0.37, h: 0.6 },
    { x: 0.06, y: 0.2, w: 0.25, h: 0.28 },
    { x: 0.3, y: 0.3, w: 0.14, h: 0.16 },
    { x: 0.3, y: 0.45, w: 0.22, h: 0.13 },
    { x: 0.05, y: 0.83, w: 0.29, h: 0.15 },
  ],
  student_id: [
    { x: 0.35, y: 0.4, w: 0.5, h: 0.12 },
    { x: 0.35, y: 0.55, w: 0.5, h: 0.12 },
  ],
}
const getMaskRegions = (t) => MASK_REGIONS[t] || MASK_REGIONS.national_id

const SUGGESTED_MASKS = {
  national_id: ['姓名', '身分證字號', '照片', '出生日期'],
  health_card: ['姓名', '身分證字號', '照片', '卡號'],
  student_id: ['姓名', '學號', '系所', '照片'],
  other: ['姓名', '證件號碼／編號', '照片', '出生日期', '地址', '電話', '條碼／QR Code'],
}

export default function MaskingModal({ file, docType, onCancel, onConfirm }) {
  const [phase, setPhase] = useState('crop') // crop | mask
  const [status, setStatus] = useState('')
  const [maskCount, setMaskCount] = useState(0)
  const [autoPlaced, setAutoPlaced] = useState(false)
  const [imgUrl, setImgUrl] = useState('') // 需為 state：<img src> 才會真的更新

  const manualType = docType === 'student_id' || docType === 'other'
  const isManualRef = useRef(manualType)

  const imgRef = useRef(null)
  const cropperRef = useRef(null)
  const previewRef = useRef(null)
  const overlayRef = useRef(null)
  const baseDataRef = useRef(null)
  const masksRef = useRef([])
  const croppedRef = useRef(null)
  const drawRef = useRef({ drawing: false, x: 0, y: 0 })

  // 建立圖片來源（供 cropper 使用）
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // 裁切階段：等 imgUrl 就緒後初始化 cropperjs
  useEffect(() => {
    if (phase !== 'crop' || !imgUrl || !imgRef.current) return
    const autoType = docType === 'national_id' || docType === 'health_card'
    const cropper = new Cropper(imgRef.current, {
      aspectRatio: autoType ? ID_RATIO : NaN,
      viewMode: 1,
      autoCropArea: 0.9,
      dragMode: 'crop',
      movable: true,
      zoomable: true,
      zoomOnTouch: true,
      wheelZoom: false,
      rotatable: false,
      scalable: false,
      guides: true,
      center: true,
      minCropBoxWidth: 40,
      minCropBoxHeight: 40,
    })
    cropperRef.current = cropper
    return () => { cropper.destroy(); cropperRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, docType, imgUrl])

  function redraw() {
    const ctx = previewRef.current.getContext('2d')
    ctx.putImageData(baseDataRef.current, 0, 0)
    ctx.fillStyle = '#1a1a1a'
    for (const m of masksRef.current) ctx.fillRect(m.x, m.y, m.w, m.h)
  }

  function confirmCrop() {
    // 只在這裡算裁切結果；實際畫到 canvas 交給 mask 階段掛上後的 effect，
    // 避免在 canvas 還沒 mount 時就存取 ref。
    croppedRef.current = cropperRef.current.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200 })
    setPhase('mask')
  }

  // mask 階段的 canvas 掛上後：畫底圖 + 依證件版型自動打碼（或轉手動）。
  useEffect(() => {
    if (phase !== 'mask' || !croppedRef.current || !previewRef.current) return
    const cropped = croppedRef.current
    const main = previewRef.current
    const overlay = overlayRef.current
    main.width = cropped.width
    main.height = cropped.height
    overlay.width = cropped.width
    overlay.height = cropped.height
    const ctx = main.getContext('2d')
    ctx.drawImage(cropped, 0, 0)
    baseDataRef.current = ctx.getImageData(0, 0, main.width, main.height)
    masksRef.current = []

    isManualRef.current = manualType
    let placed = false
    if (!manualType) {
      for (const r of getMaskRegions(docType)) {
        masksRef.current.push({
          x: r.x * main.width, y: r.y * main.height,
          w: r.w * main.width, h: r.h * main.height,
        })
      }
      placed = masksRef.current.length > 0
      if (!placed) { isManualRef.current = true; setStatus('自動打碼失敗，請手動拖曳遮蔽。') }
    }
    setAutoPlaced(placed)
    redraw()
    setMaskCount(masksRef.current.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

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
    const octx = overlayRef.current.getContext('2d')
    octx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height)
    octx.fillStyle = 'rgba(26,26,26,0.5)'
    octx.fillRect(drawRef.current.x, drawRef.current.y, p.x - drawRef.current.x, p.y - drawRef.current.y)
    octx.strokeStyle = '#4A3728'
    octx.lineWidth = 2
    octx.strokeRect(drawRef.current.x, drawRef.current.y, p.x - drawRef.current.x, p.y - drawRef.current.y)
  }
  function onUp(e) {
    if (!drawRef.current.drawing) return
    drawRef.current.drawing = false
    const p = posFrom(e)
    const octx = overlayRef.current.getContext('2d')
    octx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height)
    const w = p.x - drawRef.current.x
    const h = p.y - drawRef.current.y
    if (Math.abs(w) < 5 || Math.abs(h) < 5) return
    masksRef.current.push({ x: drawRef.current.x, y: drawRef.current.y, w, h })
    redraw()
    setMaskCount(masksRef.current.length)
  }

  function undo() {
    if (!masksRef.current.length) return
    masksRef.current.pop(); redraw(); setMaskCount(masksRef.current.length)
  }
  function clearAll() {
    masksRef.current = []; redraw(); setMaskCount(0)
  }

  // 壓成 JPEG data URL，逐步降級直到塞得進 Firestore（1MB）
  function exportMaskedImage() {
    const main = previewRef.current
    for (const [maxSide, quality] of [[900, 0.7], [800, 0.6], [640, 0.5], [480, 0.4]]) {
      const scale = Math.min(1, maxSide / Math.max(main.width, main.height))
      const out = document.createElement('canvas')
      out.width = Math.round(main.width * scale)
      out.height = Math.round(main.height * scale)
      out.getContext('2d').drawImage(main, 0, 0, out.width, out.height)
      const url = out.toDataURL('image/jpeg', quality)
      if (url.length <= MAX_IMAGE_CHARS) return url
    }
    return null
  }

  function confirmUpload() {
    if (!masksRef.current.length) { setStatus('請先遮蔽證件上的個人資料再上傳。'); return }
    const image = exportMaskedImage()
    if (!image) { setStatus('圖片壓縮後仍太大，請重新裁切成較小範圍。'); return }
    onConfirm({ image, maskRegionCount: masksRef.current.length, manual: isManualRef.current })
  }

  const suggest = autoPlaced
    ? '已依證件版型自動打碼。黑框若沒對齊，可直接在圖上拖曳新增，或按「↩ 上一步」移除最後一個。'
    : `這類證件建議遮蔽：${(SUGGESTED_MASKS[docType] || SUGGESTED_MASKS.other).join('、')}（沒有的項目可略過）`

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-4">
      <div className="mx-auto flex max-h-full w-full max-w-[430px] flex-col overflow-hidden rounded-2xl bg-base">
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
          <button type="button" onClick={onCancel} className="text-sm text-brown">取消</button>
          <span className="text-base font-bold text-brown">
            {phase === 'crop' ? '裁切證件' : '遮蔽個資'}
          </span>
          <span className="w-8" />
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {phase === 'crop' ? (
            <>
              <p className="mb-3 text-xs text-brown/70">
                {docType === 'national_id' || docType === 'health_card'
                  ? '把裁切框四邊拉到卡片邊緣（比例已鎖成證件比例），自動打碼才對得準。'
                  : '把裁切框拉到證件範圍，下一步再手動遮蔽個資。'}
              </p>
              <div className="max-h-[55vh] overflow-hidden rounded-xl bg-black/5">
                <img ref={imgRef} src={imgUrl} alt="待裁切證件" className="block max-w-full" />
              </div>
            </>
          ) : (
            <>
              <p className="mb-2 text-xs text-brown/70">{suggest}</p>
              <div className="relative overflow-hidden rounded-xl">
                <canvas ref={previewRef} className="block w-full" />
                <canvas
                  ref={overlayRef}
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  className="absolute inset-0 h-full w-full touch-none"
                  style={{ cursor: 'crosshair' }}
                />
              </div>
              <p className={`mt-2 text-xs ${maskCount ? 'text-brown/70' : 'text-error'}`}>
                {maskCount ? `已遮蔽 ${maskCount} 個區域（可拖曳新增、↩ 上一步移除）` : '尚未遮蔽任何區域，打碼後才能上傳'}
              </p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={undo} className="rounded-full border border-black bg-input px-4 py-1 text-sm text-brown">↩ 上一步</button>
                <button type="button" onClick={clearAll} className="rounded-full border border-black bg-input px-4 py-1 text-sm text-brown">清除</button>
              </div>
            </>
          )}
          {status && <p className="mt-2 text-sm text-error">{status}</p>}
        </div>

        <div className="border-t border-black/10 p-4">
          {phase === 'crop' ? (
            <button type="button" onClick={confirmCrop}
              className="h-12 w-full rounded-full border border-black bg-blue text-base font-medium text-brown">
              下一步：遮蔽個資
            </button>
          ) : (
            <button type="button" onClick={confirmUpload} disabled={!maskCount}
              className="h-12 w-full rounded-full border border-black bg-blue text-base font-medium text-brown disabled:opacity-60">
              完成打碼，套用照片
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
