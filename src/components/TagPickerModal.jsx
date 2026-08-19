import { useEffect, useState } from 'react'
import { TAG_TAXONOMY } from '../data/tagTaxonomy'

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="2.5" strokeLinecap="round" {...props}>
      <line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  )
}
function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 12.5l5 5 11-12" />
    </svg>
  )
}
function TagXIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="2.5" strokeLinecap="round" {...props}>
      <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div
        className="flex max-h-[70vh] w-[300px] flex-col overflow-hidden rounded-[10px] bg-card shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header: 取消 / 確認 */}
        <div className="flex items-center justify-between px-4 pt-2.5">
          <button type="button" onClick={onClose} aria-label="取消" className="p-1">
            <XIcon className="h-[26px] w-[26px]" />
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(selected); onClose() }}
            aria-label="確認"
            className="p-1 text-navy"
          >
            <CheckIcon className="h-[26px] w-[26px]" />
          </button>
        </div>

        {/* 已選標籤 */}
        <div className="px-4 pb-3 pt-1">
          <p className="mb-2 text-base font-medium text-brown">已選標籤</p>
          <div className="flex flex-wrap gap-2">
            {selected.length === 0 && <span className="text-xs text-brown/50">尚未選擇</span>}
            {selected.map((tag) => (
              <span key={tag} className="flex items-center gap-1.5 rounded-full border border-black bg-blue px-4 py-1.5 text-xs text-brown">
                {tag}
                <button type="button" onClick={() => toggle(tag)} aria-label={`移除 ${tag}`} className="p-0.5">
                  <TagXIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 分類標籤（每一類左右滑動，不換行） */}
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-black/10 px-4 py-3">
          {taxonomy.map((cat) => (
            <div key={cat.category} className="mb-4">
              <p className="mb-2 text-base font-medium text-brown">{cat.category}</p>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {cat.tags.map((tag) => {
                  const on = selected.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggle(tag)}
                      className={`shrink-0 whitespace-nowrap rounded-full border border-black bg-blue px-4 py-1.5 text-xs text-brown transition
                        ${on ? 'font-medium ring-2 ring-inset ring-navy' : 'font-normal'}`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
