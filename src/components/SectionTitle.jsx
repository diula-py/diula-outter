/**
 * 區塊標題：粗體 20/700，文字左緣距內容欄 55px（新版設計稿 Frame 22：文字 x=77、內容欄 x=22）。
 * 左側直條：位置照設計稿（中心距內容欄 25px，Line 1 中心 x=47），大小維持 outter 原本的 5×21 圓角
 * （使用者指定保留，不改成設計稿的 5×30 直角）。
 */
export default function SectionTitle({ children }) {
  return (
    <h2 className="relative ml-[55px] h-5 text-xl font-bold leading-5 text-brown">
      <span
        className="absolute -left-[32.5px] top-1/2 h-[21px] w-[5px] -translate-y-1/2 rounded-[3px] bg-brown"
        aria-hidden="true"
      />
      {children}
    </h2>
  )
}
