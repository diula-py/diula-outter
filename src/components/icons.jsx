/**
 * 共用 icon 元件。全部改用 inner（diula-inner）的原始 PNG 素材，跟 inner 畫面
 * 逐像素一致；不再是可變色的 inline SVG，className 只控制尺寸（text-* 顏色類
 * 對 <img> 沒有作用，留著也無妨，純粹是既有呼叫端沒清乾淨的殘留 class）。
 * 用法：<CalendarIcon className="h-9 w-9" />
 */
import { asset } from '../lib/asset'

function Icon({ src, alt = '', className, ...props }) {
  return <img src={asset(src)} alt={alt} aria-hidden={alt ? undefined : 'true'} className={`object-contain ${className || ''}`} {...props} />
}

export function ChevronLeftIcon(props) {
  return <Icon src="/icons/chevron-left.png" {...props} />
}

export function HouseIcon(props) {
  return <Icon src="/icons/house.png" {...props} />
}

export function ChevronDownIcon(props) {
  return <Icon src="/icons/chevron-down.png" {...props} />
}

export function CalendarIcon(props) {
  return <Icon src="/icons/calendar.png" {...props} />
}

export function LocationIcon(props) {
  return <Icon src="/icons/location.png" {...props} />
}

export function CircleCheckIcon(props) {
  return <Icon src="/icons/circle-check.png" {...props} />
}

export function MagnifyingGlassIcon(props) {
  return <Icon src="/icons/search.png" {...props} />
}

export function CubesIcon(props) {
  return <Icon src="/icons/cubes.png" {...props} />
}

export function FolderIcon(props) {
  return <Icon src="/icons/folder-closed.png" {...props} />
}

export function UserRegularIcon(props) {
  return <Icon src="/icons/user.png" {...props} />
}

export function WandIcon(props) {
  return <Icon src="/icons/wand.png" {...props} />
}

/**
 * AI 辨識過場的魔法棒（2026-11）：形狀同 wand.png，改成 inline SVG 讓三顆星星可以分開閃爍
 * （動畫在 index.css 的 .diula-wand）。
 * 顏色：SVG 用 currentColor，跟著這裡的 text-navy（同 wand.png 的深藍）。
 * 之後 icon 全面換咖啡色時，把 text-navy 改成 text-brown 就好。
 */
export function WandSparkleIcon({ className }) {
  return (
    <svg className={`diula-wand text-navy ${className || ''}`} viewBox="0 0 640 640" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      {/*!Font Awesome Free 7.3.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.*/}
      {/* 魔法棒（不動） */}
      <path d="M492 64C503 64 513.6 68.4 521.5 76.2L563.8 118.5C571.6 126.4 576 137 576 148C576 159 571.6 169.6 563.8 177.5L475.6 265.7L374.3 164.4L462.5 76.2C470.4 68.4 481 64 492 64zM76.2 462.5L340.4 198.3L441.7 299.6L177.5 563.8C169.6 571.6 159 576 148 576C137 576 126.4 571.6 118.5 563.8L76.2 521.5C68.4 513.6 64 503 64 492C64 481 68.4 470.4 76.2 462.5z" />
      {/* 三顆星星（會閃） */}
      <path className="sparkle sparkle--big" d="M142.7 105.7L164.2 155.8L214.3 177.3C220.2 179.8 224 185.6 224 192C224 198.4 220.2 204.2 214.3 206.7L164.2 228.2L142.7 278.3C140.2 284.2 134.4 288 128 288C121.6 288 115.8 284.2 113.3 278.3L91.8 228.2L41.7 206.7C35.8 204.2 32 198.4 32 192C32 185.6 35.8 179.8 41.7 177.3L91.8 155.8L113.3 105.7C115.8 99.8 121.6 96 128 96C134.4 96 140.2 99.8 142.7 105.7z" />
      <path className="sparkle sparkle--top" d="M295.4 37L310.2 73.8L347 88.6C350 89.8 352 92.8 352 96C352 99.2 350 102.2 347 103.4L310.2 118.2L295.4 155C294.2 158 291.2 160 288 160C284.8 160 281.8 158 280.6 155L265.8 118.2L229 103.4C226 102.2 224 99.2 224 96C224 92.8 226 89.8 229 88.6L265.8 73.8L280.6 37C281.8 34 284.8 32 288 32C291.2 32 294.2 34 295.4 37z" />
      <path className="sparkle sparkle--low" d="M496 368C502.4 368 508.2 371.8 510.7 377.7L532.2 427.8L582.3 449.3C588.2 451.8 592 457.6 592 464C592 470.4 588.2 476.2 582.3 478.7L532.2 500.2L510.7 550.3C508.2 556.2 502.4 560 496 560C489.6 560 483.8 556.2 481.3 550.3L459.8 500.2L409.7 478.7C403.8 476.2 400 470.4 400 464C400 457.6 403.8 451.8 409.7 449.3L459.8 427.8L481.3 377.7C483.8 371.8 489.6 368 496 368z" />
    </svg>
  )
}

export function PlusIcon(props) {
  return <Icon src="/icons/plus.png" {...props} />
}

export function PersonChalkboardIcon(props) {
  return <Icon src="/icons/person-chalkboard.png" {...props} />
}

export function XmarkIcon(props) {
  return <Icon src="/icons/xmark.png" {...props} />
}

/**
 * DiuLa! 品牌標記（地標＋放大鏡＋點，整體像驚嘆號）。無圖時的縮圖／預覽 placeholder 用。
 * 用官方 PNG 素材（public/icons/diula-icon.png）；className 控制尺寸，需淡化用 opacity-*。
 */
export function DiulaPinIcon({ className = '', ...props }) {
  return (
    <img
      src={asset('/icons/diula-icon.png')}
      alt=""
      aria-hidden="true"
      className={`object-contain ${className}`}
      {...props}
    />
  )
}
