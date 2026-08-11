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
 * props: open, value(已選標籤陣列), onClose, onConfirm(tags)
 */
export default function TagPickerModal({ open, value, onClose, onConfirm }) {
  const [selected, setSelected] = useState([])

  useEffect(() => {
    if (open) setSelected(value || [])
  }, [open, value])

  if (!open) return null

  const toggle = (tag) =>
    setSelected((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-[360px] flex-col overflow-hidden rounded-2xl bg-card shadow-[0_6px_24px_rgba(0,0,0,0.28)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header: 取消 / 確認 */}
        <div className="flex items-center justify-between px-5 pt-4">
          <button type="button" onClick={onClose} aria-label="取消" className="p-1">
            <XIcon className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(selected); onClose() }}
            aria-label="確認"
            className="p-1 text-navy"
          >
            <CheckIcon className="h-6 w-6" />
          </button>
        </div>

        {/* 已選標籤 */}
        <div className="px-5 pb-3 pt-1">
          <p className="mb-2 text-sm font-medium text-brown">已選標籤</p>
          <div className="flex flex-wrap gap-2">
            {selected.length === 0 && <span className="text-xs text-brown/50">尚未選擇</span>}
            {selected.map((tag) => (
              <span key={tag} className="flex items-center gap-1.5 rounded-[50px] border border-black bg-blue px-3.5 py-1 text-xs text-brown">
                {tag}
                <button type="button" onClick={() => toggle(tag)} aria-label={`移除 ${tag}`} className="p-0.5">
                  <TagXIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 分類標籤（可捲動） */}
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-black/10 px-5 py-3">
          {TAG_TAXONOMY.map((cat) => (
            <div key={cat.category} className="mb-4">
              <p className="mb-2 font-bold text-brown">{cat.category}</p>
              <div className="flex flex-wrap gap-2">
                {cat.tags.map((tag) => {
                  const on = selected.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggle(tag)}
                      className={`rounded-[50px] border border-black px-3.5 py-1 text-xs text-brown transition
                        ${on ? 'bg-blue font-medium' : 'bg-white'}`}
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
