/**
 * 區塊標題：粗體 20/700。位置照新版設計稿 Frame 22（x=22、padding 10、gap 15、寬 135）：
 * Line 1 轉 90° 後在 auto layout 裡寬度是 0，所以直條中心 x=32、文字起點 x=47
 * （135 = 10 + 0 + 15 + 100 + 10）。換算成距內容欄：直條中心 10px、文字 25px。
 * 直條大小維持 outter 原本的 5×21 圓角（使用者指定保留，不改成設計稿的 5×30 直角）。
 */
export default function SectionTitle({ children }) {
  return (
    <h2 className="relative ml-[25px] h-5 text-xl font-bold leading-5 text-brown">
      <span
        className="absolute -left-[17.5px] top-1/2 h-[21px] w-[5px] -translate-y-1/2 rounded-[3px] bg-brown"
        aria-hidden="true"
      />
      {children}
    </h2>
  )
}
