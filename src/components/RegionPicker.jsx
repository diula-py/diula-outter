import { useEffect, useRef, useState } from 'react'
import { TAIWAN_REGIONS, CITY_ORDER } from '../data/taiwanRegions'

const ITEM_H = 40 // 每個選項高度（px）
const VISIBLE = 5 // 可見列數（需為奇數，中央那列為選中）
const PAD = ((VISIBLE - 1) / 2) * ITEM_H // 上下留白，讓頭尾項也能置中

// 單欄滾輪：scroll-snap 對齊，停止捲動後回報中央選項。
function Wheel({ items, index, onIndexChange, ariaLabel }) {
  const ref = useRef(null)
  const timer = useRef(null)

  // index 由外部變動時（例如換縣市重置地區），捲到對應位置。
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const target = index * ITEM_H
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target
  }, [index, items])

  function handleScroll() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const el = ref.current
      if (!el) return
      const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)))
      // 對齊到整格
      const target = i * ITEM_H
      if (Math.abs(el.scrollTop - target) > 1) el.scrollTo({ top: target, behavior: 'smooth' })
      if (i !== index) onIndexChange(i)
    }, 90)
  }

  return (
    <div className="relative flex-1" style={{ height: VISIBLE * ITEM_H }}>
      <div
        ref={ref}
        role="listbox"
        aria-label={ariaLabel}
        onScroll={handleScroll}
        className="h-full snap-y snap-mandatory overflow-y-scroll scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingTop: PAD, paddingBottom: PAD }}
      >
        {items.map((it, i) => (
          <div
            key={it}
            role="option"
            aria-selected={i === index}
            onClick={() => onIndexChange(i)}
            className={`flex snap-center items-center justify-center text-center transition-colors ${
              i === index ? 'text-base font-semibold text-brown' : 'text-sm text-brown/40'
            }`}
            style={{ height: ITEM_H }}
          >
            {it}
          </div>
        ))}
      </div>
      {/* 中央選中列的上下分隔線 */}
      <div
        className="pointer-events-none absolute inset-x-0 border-y border-black/15"
        style={{ top: PAD, height: ITEM_H }}
      />
    </div>
  )
}

// 底部彈出的縣市＋地區兩欄滾輪。value 為「縣市 地區」字串。
export default function RegionPicker({ open, value, onClose, onConfirm, title = '遺失的地點' }) {
  const [cityIdx, setCityIdx] = useState(0)
  const [districtIdx, setDistrictIdx] = useState(0)

  const cities = CITY_ORDER
  const districts = TAIWAN_REGIONS[cities[cityIdx]] || []

  // 開啟時把目前的 value 還原成兩欄的索引。
  useEffect(() => {
    if (!open) return
    const [c, d] = (value || '').split(' ')
    const ci = Math.max(0, cities.indexOf(c))
    setCityIdx(ci)
    const ds = TAIWAN_REGIONS[cities[ci]] || []
    setDistrictIdx(Math.max(0, ds.indexOf(d)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function pickCity(i) {
    setCityIdx(i)
    setDistrictIdx(0) // 換縣市→地區歸零
  }

  function confirm() {
    const city = cities[cityIdx]
    const district = (TAIWAN_REGIONS[city] || [])[districtIdx] || ''
    onConfirm(`${city} ${district}`.trim())
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" onClick={onClose}>
      <div
        className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-base shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
          <button type="button" onClick={onClose} className="text-sm text-brown/70">取消</button>
          <span className="text-base font-bold text-brown">{title}</span>
          <button type="button" onClick={confirm} className="text-sm font-semibold text-brown">完成</button>
        </div>
        <div className="flex gap-2 px-4 py-3">
          <Wheel items={cities} index={cityIdx} onIndexChange={pickCity} ariaLabel="選擇縣市" />
          <Wheel items={districts} index={districtIdx} onIndexChange={setDistrictIdx} ariaLabel="選擇地區" />
        </div>
      </div>
    </div>
  )
}
