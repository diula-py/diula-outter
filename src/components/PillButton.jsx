/**
 * 米色圓角膠囊按鈕：icon + 文字並排靠左（比照 design.md／inner：
 * 100px 高、30px 40px padding、icon 與文字間 gap 40px），咖啡色細框。
 * 兩種用法：
 *   1. 內部路由 / 動作 → 傳 onClick（渲染成 <button>）
 *   2. 外部頁面連結   → 傳 href（渲染成 <a>，整頁跳轉、可中鍵開新分頁）
 * props: icon, label, onClick?, href?, external?
 */
const BASE_CLASS =
  'flex h-[100px] w-full items-center gap-10 rounded-[50px] px-10 py-[30px] ' +
  'border border-brown bg-card text-base font-medium text-brown no-underline ' +
  'transition hover:bg-[#eee8d7] active:scale-[.985] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown'

function Inner({ icon, label }) {
  return (
    <>
      <img src={icon} alt="" aria-hidden="true" className="h-10 w-10 shrink-0 object-contain" />
      <span>{label}</span>
    </>
  )
}

export default function PillButton({ icon, label, onClick, href, external }) {
  if (href) {
    return (
      <a
        href={href}
        className={BASE_CLASS}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        <Inner icon={icon} label={label} />
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={BASE_CLASS}>
      <Inner icon={icon} label={label} />
    </button>
  )
}
