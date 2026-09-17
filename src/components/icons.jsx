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
