// 上傳前縮圖：把 data URL 圖片縮到 maxSide 內、轉 JPEG，並確保轉完真的小於 maxBytes。
// 用途：手機實拍照片 base64 動輒 1~2MB 以上（原相機拍出來很常見，現代手機動輒
// 12MP 以上），下游有兩個硬限制：後端（Spring/Tomcat）請求上限約 2MB（超過回 413，
// 瀏覽器常顯示 "Load failed"）、Firestore 單筆文件 1MB 上限（ConfirmTagsPage 存
// 「我的遺失物」會踩到，見那邊的註解）。
// 2026-11 修：以前只縮一次「尺寸」、品質固定不變——原圖解析度極高或內容複雜時，
// 縮到同樣尺寸還是可能超過位元組上限，使用者得自己先手動壓縮過一次才能用，這不合理。
// 改成轉完先量實際大小，還是太大就重轉：先降品質，品質已經壓到底（0.3）還不夠就
// 改降尺寸，最多試幾輪，直到確定在安全範圍內——不用使用者自己猜照片能不能用。
export function downscale(dataUrl, maxSide = 1600, quality = 0.85, maxBytes = 700_000) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      function render(side, q) {
        const scale = Math.min(1, side / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        ctx.fillStyle = '#ffffff' // JPEG 無透明，先鋪白底避免透明區變黑
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        return c.toDataURL('image/jpeg', q)
      }
      try {
        let side = maxSide
        let q = quality
        let out = render(side, q)
        // data URL 的 base64 部分每 4 字元代表 3 bytes，用長度 ×0.75 粗估實際位元組數
        // 就夠判斷「還是太大」，不需要精確值。品質優先每次降 0.15；壓到 0.3 這個下限
        // （太低畫質會糟到 AI 辨識不出來）還不夠小，才開始降尺寸（×0.75），最低到 400px。
        for (let i = 0; i < 6 && out.length * 0.75 > maxBytes && (q > 0.3 || side > 400); i++) {
          if (q > 0.3) q -= 0.15
          else side = Math.max(400, Math.round(side * 0.75))
          out = render(side, q)
        }
        resolve(out)
      } catch { resolve(dataUrl) }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
