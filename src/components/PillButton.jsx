/**
 * 米色圓角膠囊按鈕：icon + 文字並排靠左（比照 design.md／inner：
 * 100px 高、30px 40px padding、icon 與文字間 gap 40px），咖啡色細框。
 * 寬度不到 380 的螢幕 padding 與 gap 縮成 20，「非證件類遺失物登錄」才排得進一行。
 * 兩種用法：
 *   1. 內部路由 / 動作 → 傳 onClick（渲染成 <button>）
 *   2. 外部頁面連結   → 傳 href（渲染成 <a>，整頁跳轉、可中鍵開新分頁）
 * props: icon, label, onClick?, href?, external?, dimmed?, primary?
 * dimmed：看起來是停用的（變淡），但仍可以按——用來在離線時按下去跳說明，而不是完全沒反應。
 * primary：同一組裡最主要的任務用實色底（2026-11 設計討論：同一區塊內的按鈕長得一模一樣，
 *   使用者得逐字讀完才分得出主次，先讓最花心力做的那顆視覺上跳出來）。icon 是深咖啡色線稿 PNG，
 *   疊在深色底上要轉白才看得見，用 brightness-0 invert 濾鏡反相（不用重新出圖）。
 */
const BASE_CLASS =
  'flex h-[100px] w-full items-center gap-5 rounded-[50px] px-5 py-[30px] min-[380px]:gap-10 min-[380px]:px-10 land:h-[88px] land:py-5 ' +
  'text-base font-medium no-underline transition active:scale-[.985] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown'

const SECONDARY_CLASS = `${BASE_CLASS} border border-brown bg-card text-brown hover:bg-[#eee8d7]`
const PRIMARY_CLASS = `${BASE_CLASS} border border-brown bg-brown text-paper hover:bg-[#5c3a1b]`

function Inner({ icon, label, primary }) {
  return (
    <>
      <img
        src={icon}
        alt=""
        aria-hidden="true"
        className={`h-10 w-10 shrink-0 object-contain ${primary ? 'brightness-0 invert' : ''}`}
      />
      <span>{label}</span>
    </>
  )
}

export default function PillButton({ icon, label, onClick, href, external, dimmed, primary }) {
  const className = primary ? PRIMARY_CLASS : SECONDARY_CLASS

  if (href) {
    return (
      <a
        href={href}
        className={className}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        <Inner icon={icon} label={label} primary={primary} />
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} aria-disabled={dimmed || undefined} className={dimmed ? `${className} opacity-40` : className}>
      <Inner icon={icon} label={label} primary={primary} />
    </button>
  )
}
