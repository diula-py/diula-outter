// 上傳前縮圖：把 data URL 圖片縮到 maxSide 內、轉 JPEG。
// 用途：手機實拍照片 base64 動輒數 MB，後端（Spring/Tomcat）請求上限約 2MB，
// 超過會回 413（在瀏覽器常顯示為 "Load failed"）。縮圖後 payload 通常 <500KB。
export function downscale(dataUrl, maxSide = 1600, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      ctx.fillStyle = '#ffffff' // JPEG 無透明，先鋪白底避免透明區變黑
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      try { resolve(c.toDataURL('image/jpeg', quality)) } catch { resolve(dataUrl) }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
