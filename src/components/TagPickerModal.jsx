import { useEffect, useState } from 'react'
import { TAG_TAXONOMY } from '../data/tagTaxonomy'

// inner tag-modal 的關閉（X）與確認（打勾）：20×20 inline SVG，實心路徑（Material 風格）
function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  )
}
function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
    </svg>
  )
}

/**
 * 新增標籤彈窗：依分類挑標籤。
 * props:
 *   open, value(已選標籤陣列), onClose, onConfirm(tags)
 *   taxonomy 自訂分類清單（預設全部 TAG_TAXONOMY）
 *   single   單選模式（選一個會取代前一個；證件登錄用）
 */
export default function TagPickerModal({ open, value, onClose, onConfirm, taxonomy = TAG_TAXONOMY, single = false }) {
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (open) setSelected(value || [])
  }, [open, value])

  if (!open) return null

  const toggle = (tag) =>
    setSelected((prev) => {
      if (single) return prev.includes(tag) ? [] : [tag]
      return prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    })

  // inner .modal-tag：高 30、padding 10 20、間距 8、12/400、白底黑框；已選＝藍底
  const chip = (on) =>
    `box-border inline-flex h-[30px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[50px] border border-black px-5 py-[10px] text-xs font-normal leading-3 text-brown ${on ? 'bg-blue' : 'bg-white'}`

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative flex max-h-[80vh] w-[300px] flex-col overflow-hidden rounded-[10px] bg-card shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header：X（左）／打勾（右，未選時淡灰 50%）／「已選標籤」置中／已選 chip */}
        <div className="relative z-[1] w-full shrink-0 rounded-t-[10px] bg-card py-[15px]">
          <button
            type="button"
            onClick={onClose}
            aria-label="取消"
            className="absolute left-[15px] top-[5px] flex h-7 w-7 items-center justify-center text-brown"
          >
            <XIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(selected); onClose() }}
            disabled={selected.length === 0}
            aria-label="確認"
            className={`absolute right-[15px] top-[5px] flex h-7 w-7 items-center justify-center transition ${selected.length ? 'text-brown' : 'text-[#888] opacity-50'}`}
          >
            <CheckIcon className="h-5 w-5" />
          </button>
          <div className="w-full px-[15px] text-center text-base font-medium leading-4 text-brown">已選標籤</div>
          <div className="mt-[15px] flex max-h-[90px] flex-wrap gap-[10px] overflow-y-auto px-5">
            {selected.length === 0 && <div className="text-xs font-normal text-brown opacity-50">尚未選擇標籤</div>}
            {selected.map((tag) => (
              <button key={tag} type="button" onClick={() => toggle(tag)} aria-label={`移除 ${tag}`} className={chip(true)}>
                {tag}
                <span className="text-sm font-bold leading-none">×</span>
              </button>
            ))}
          </div>
        </div>

        {/* 分類標籤（每類換行；分類標題 16/500，上距 20、下距 10） */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-[5px]">
          {taxonomy.map((cat) => (
            <div key={cat.category}>
              <div className="mb-[10px] mt-5 text-base font-medium leading-4 text-brown">{cat.category}</div>
              <div className="flex flex-wrap gap-2 pb-2">
                {cat.tags.map((tag) => (
                  <button key={tag} type="button" onClick={() => toggle(tag)} className={chip(selected.includes(tag))}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
