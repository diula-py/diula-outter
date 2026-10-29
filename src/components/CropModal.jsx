import { useEffect, useRef, useState } from 'react'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { Backdrop } from './DialogKit'

// 框選物品：拖曳裁切框框住物品，輸出框內範圍的 JPEG，之後 AI 辨識、存檔、Threads 協尋文都用這張。
// 與 MaskingModal（證件專用、鎖證件比例）不同，這支比例不鎖；不一定要框，按「使用整張照片」回傳 null。
const MAX_SIDE = 1600 // 輸出上限邊長，送出前還會再縮

export default function CropModal({ src, onCancel, onConfirm }) {
  const imgRef = useRef(null)
  const cropperRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!src || !imgRef.current) return
    const cropper = new Cropper(imgRef.current, {
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
      ready: () => setReady(true),
    })
    cropperRef.current = cropper
    return () => { cropper.destroy(); cropperRef.current = null }
  }, [src])

  function done() {
    const canvas = cropperRef.current?.getCroppedCanvas({
      maxWidth: MAX_SIDE,
      maxHeight: MAX_SIDE,
      fillColor: '#ffffff', // JPEG 無透明，鋪白底
      imageSmoothingQuality: 'high',
    })
    if (!canvas) return
    onConfirm(canvas.toDataURL('image/jpeg', 0.9))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Backdrop className="bg-black/70" />
      <div className="relative flex max-h-full w-full max-w-[393px] flex-col overflow-hidden rounded-2xl bg-paper">
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
          <button type="button" onClick={onCancel} className="text-sm text-brown">取消</button>
          <span className="text-base font-bold text-brown">框選物品</span>
          <button type="button" onClick={done} disabled={!ready} className="text-sm font-bold text-brown disabled:opacity-50">完成</button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <p className="mb-1 text-sm font-medium leading-normal text-brown">若圖中有多項物品可使用框選功能</p>
          <p className="mb-3 text-xs leading-normal text-brown/70">
            拖曳框的四邊或四角框住要辨識的物品，之後 AI 辨識、存檔與 Threads 協尋文都只用框內的範圍。不需要框選就按「使用整張照片」。
          </p>
          <div className="max-h-[55vh] overflow-hidden rounded-xl bg-black/5">
            <img ref={imgRef} src={src} alt="待框選照片" className="block max-w-full" />
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-black/10 p-4">
          <button type="button" onClick={done} disabled={!ready}
            className="h-12 w-full rounded-full border border-black bg-blue text-base font-medium text-brown disabled:opacity-60">
            完成框選
          </button>
          <button type="button" onClick={() => onConfirm(null)}
            className="h-10 w-full rounded-full border border-black bg-input text-sm font-medium text-brown">
            使用整張照片
          </button>
        </div>
      </div>
    </div>
  )
}

// 表單頁共用：選照片 → 自動跳出框選（可略過）。
// photo／photoUrl 是原圖（重新框選一律以原圖為底），cropped 是框選結果（null＝用整張），預覽與送出都優先用它。
export function useItemPhoto() {
  const [photo, setPhoto] = useState(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [cropped, setCropped] = useState(null)
  const [pending, setPending] = useState(null) // 剛選、還沒框選完的 { file, url }
  const [recropping, setRecropping] = useState(false)

  function handlePhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // 讓同一張照片能重選
    if (!file) return
    setPending({ file, url: URL.createObjectURL(file) })
  }

  function confirm(url) {
    if (pending) {
      // 新照片框選完才換掉舊的；取消的話舊照片維持不變
      if (photoUrl) URL.revokeObjectURL(photoUrl)
      setPhoto(pending.file)
      setPhotoUrl(pending.url)
      setPending(null)
    }
    setCropped(url)
    setRecropping(false)
  }

  function cancel() {
    if (pending) URL.revokeObjectURL(pending.url)
    setPending(null)
    setRecropping(false)
  }

  const modalSrc = pending?.url || (recropping ? photoUrl : '')
  const modal = modalSrc
    ? <CropModal key={modalSrc} src={modalSrc} onCancel={cancel} onConfirm={confirm} />
    : null

  return {
    photo,
    previewUrl: cropped || photoUrl,
    cropped,
    handlePhoto,
    recrop: () => setRecropping(true),
    modal,
  }
}
