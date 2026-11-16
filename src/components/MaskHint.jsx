import './MaskHint.css'

/**
 * 打碼提示動畫：疊在「遮蔽個資」視窗的照片上，一隻手按下、拖出一個虛線框，示範在照片上拖曳就能畫黑框。
 * 純裝飾、不擋點擊（pointer-events: none）；樣式與動畫見 MaskHint.css（2026-11-16 選定配色比較稿的 C 版）。
 * 什麼時候顯示由 MaskingModal 決定：每次進到遮蔽個資都播，手指一碰照片就收起。
 */
export default function MaskHint() {
  return (
    <div className="mask-hint" aria-hidden="true">
      <div className="mask-hint__box" />
      <div className="mask-hint__hand">
        <svg viewBox="-4 -3 56 58" xmlns="http://www.w3.org/2000/svg">
          <g transform="rotate(-14 16 2)">
            <path
              className="mask-hint__body"
              d="M12 6a4 4 0 0 1 8 0V21a3.5 3.5 0 0 1 7 0v1.5a3 3 0 0 1 6 0V24a2.75 2.75 0 0 1 5.5 0V36c0 6-4 11-10 11H21c-3 0-5.5-1.5-7.5-4L4.5 32.5c-1.3-1.5-1-3.7.6-4.8 1.5-1 3.4-.6 4.5.7L12 31V6z"
            />
            <path className="mask-hint__lines" d="M20 21v5M27 22.5v4.5M33 24v4" />
          </g>
        </svg>
      </div>
    </div>
  )
}
