import { asset } from '../lib/asset'

/**
 * 區塊標題：粗體 20/700。位置照新版設計稿 Frame 22（x=22、padding 10、gap 15、寬 135）：
 * Line 1 轉 90° 後在 auto layout 裡寬度是 0，所以直條中心 x=32、文字起點 x=47
 * （135 = 10 + 0 + 15 + 100 + 10）。換算成距內容欄：直條中心 10px、文字 25px。
 * 直條大小維持 outter 原本的 5×21 圓角（使用者指定保留，不改成設計稿的 5×30 直角）。
 *
 * 標題文字右邊 8px 放一個 20×20 問號鈕，之後點了要重新播放使用教學。
 * ⚠ 2026-11：使用教學頁還沒做，使用者指定「先沒有反應」——onHelp 沒傳就什麼都不做；
 *   教學做好後由 HomeTabPage 傳 onHelp 進來接上即可。
 */
export default function SectionTitle({ children, onHelp }) {
  return (
    <h2 className="relative ml-[25px] flex h-5 items-center text-xl font-bold leading-5 text-brown">
      <span
        className="absolute -left-[17.5px] top-1/2 h-[21px] w-[5px] -translate-y-1/2 rounded-[3px] bg-brown"
        aria-hidden="true"
      />
      {children}
      <button
        type="button"
        onClick={onHelp}
        aria-label="使用教學"
        className="back-hit relative ml-2 h-5 w-5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
      >
        <img src={asset('/icons/circle-question.png')} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
      </button>
    </h2>
  )
}
