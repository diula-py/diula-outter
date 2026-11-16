/**
 * 米色圓角膠囊按鈕：icon + 文字並排靠左（比照 design.md／inner：
 * 90px 高（新版設計稿；原 100）、30px 40px padding、icon 與文字間 gap 40px），咖啡色細框。
 * 寬度不到 380 的螢幕 padding 與 gap 縮成 20，「非證件類遺失物登錄」才排得進一行。
 * 兩種用法：
 *   1. 內部路由 / 動作 → 傳 onClick（渲染成 <button>）
 *   2. 外部頁面連結   → 傳 href（渲染成 <a>，整頁跳轉、可中鍵開新分頁）
 * props: icon, label, onClick?, href?, external?, dimmed?, tour?（聚光燈導覽用的 data-tour 值）
 * dimmed：看起來是停用的（變淡），但仍可以按——用來在離線時按到需要網路的功能，而不是完全沒反應。
 * 2026-11：原本試過加 primary 讓其中一顆變實色底當主要 CTA，使用者確認照設計稿的 CSS
 *   全部按鈕都同一個樣式，拿掉了（見 git log，這段 UI 討論沒有另外留文件記錄）。
 *
 * 2026-11 桌機版（lg:）：照 Figma 桌機設計稿的「首頁」CSS 補 lg: 尺寸——94px 高、
 * 2px 框、30px/40px padding、icon 縮到 30px。設計稿裡「尋找遺失物」卡片按鈕是黑框，
 * 「登錄拾獲物」卡片是咖啡框，用 lgBorder prop 切換（預設黑框）。
 */
const BASE_CLASS =
  'flex h-[90px] w-full items-center gap-5 rounded-[50px] px-5 min-[380px]:gap-10 min-[380px]:px-10 land:h-[88px] land:py-5 ' +
  'lg:h-[94px] lg:gap-10 lg:border-2 lg:px-10 lg:py-[30px] ' +
  'border border-brown bg-card text-base font-medium text-brown no-underline ' +
  'transition hover:bg-[#eee8d7] active:scale-[.985] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown'

const LG_BORDER_CLASS = {
  black: 'lg:border-black',
  brown: 'lg:border-[#482B12]',
}

function Inner({ icon, label }) {
  return (
    <>
      <img src={icon} alt="" aria-hidden="true" className="h-10 w-10 shrink-0 object-contain lg:h-[30px] lg:w-[30px]" />
      <span>{label}</span>
    </>
  )
}

export default function PillButton({ icon, label, onClick, href, external, dimmed, lgBorder = 'black', tour }) {
  const className = `${BASE_CLASS} ${LG_BORDER_CLASS[lgBorder]}`

  if (href) {
    return (
      <a
        href={href}
        data-tour={tour}
        className={className}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        <Inner icon={icon} label={label} />
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} data-tour={tour} aria-disabled={dimmed || undefined} className={dimmed ? `${className} opacity-40` : className}>
      <Inner icon={icon} label={label} />
    </button>
  )
}
