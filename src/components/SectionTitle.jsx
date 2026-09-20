/**
 * 區塊標題：粗體 20/700，文字位置照 inner（左緣距內容欄 57.5px），
 * 左側直條維持 outter 原本的圓角樣式（使用者指定保留，不改成 inner 的直角長條）。
 */
export default function SectionTitle({ children }) {
  return (
    <h2 className="relative ml-[57.5px] h-5 text-xl font-bold leading-5 text-brown">
      <span
        className="absolute -left-[30.5px] top-1/2 h-[21px] w-[5px] -translate-y-1/2 rounded-[3px] bg-brown"
        aria-hidden="true"
      />
      {children}
    </h2>
  )
}
