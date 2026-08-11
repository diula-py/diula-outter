/**
 * 米色圓角膠囊按鈕：icon 靠左、文字置中、咖啡色細框。
 * 兩種用法：
 *   1. 內部路由 / 動作 → 傳 onClick（渲染成 <button>）
 *   2. 外部頁面連結   → 傳 href（渲染成 <a>，整頁跳轉、可中鍵開新分頁）
 * props: icon, label, onClick?, href?, external?
 */
const BASE_CLASS =
  'relative flex min-h-[92px] w-full items-center justify-center rounded-[50px] ' +
  'border border-brown bg-card px-7 text-base font-medium text-brown no-underline ' +
  'transition hover:bg-[#eee8d7] active:scale-[.985] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown'

function Inner({ icon, label }) {
  return (
    <>
      <img
        src={icon}
        alt=""
        aria-hidden="true"
        className="absolute left-8 top-1/2 h-[38px] w-[38px] -translate-y-1/2 object-contain"
      />
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
