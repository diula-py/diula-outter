/** 區塊標題：左側咖啡色直條 + 粗體標題（H2 / 20px / 700）。 */
export default function SectionTitle({ children }) {
  return (
    <h2 className="ml-0.5 flex items-center gap-2.5 text-xl font-bold leading-none text-brown">
      <span className="h-[21px] w-[5px] rounded-[3px] bg-brown" aria-hidden="true" />
      {children}
    </h2>
  )
}
