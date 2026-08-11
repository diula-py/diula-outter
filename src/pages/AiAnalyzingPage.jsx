import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { WandIcon } from '../components/icons'

import { aiApi } from '../lib/api'

const AI_API = aiApi('/analyze-item') // dev 走 /ext-ai proxy；prod 直連 Render AI

// AI 圖片辨識過場：實際呼叫 AI 服務，拿回標籤才進確認頁。
// Render 免費方案冷啟動可能要 ~1 分鐘，進度條期間慢慢爬到 90%，回來才補到 100%。
export default function AiAnalyzingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const data = location.state || {}
  const [pct, setPct] = useState(6)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    const grow = setInterval(() => setPct((p) => (p < 90 ? p + (90 - p) * 0.05 : p)), 250)

    ;(async () => {
      try {
        const res = await fetch(AI_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: data.desc || '', base64Image: data.base64Image || null }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)

        const tags = []
        for (const it of json.items || []) {
          if (it.sub_tag) tags.push(it.sub_tag)
          for (const c of it.colors || []) tags.push(c)
        }
        const uniq = [...new Set(tags)]
        if (!uniq.length) throw new Error('AI 沒認出東西，換張清楚一點的照片或改用文字描述')

        const first = (json.items || [])[0] || {}
        const name = `${(first.colors && first.colors[0]) || ''}${first.sub_tag || ''}` || '確認標籤'

        if (!alive) return
        clearInterval(grow)
        setPct(100)
        setTimeout(() => navigate('/search/confirm', { replace: true, state: { ...data, name, tags: uniq } }), 350)
      } catch (e) {
        if (alive) { clearInterval(grow); setError(e.message) }
      }
    })()

    return () => { alive = false; clearInterval(grow) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center gap-8 bg-[#cddcf0] px-10">
      <div className="flex h-[170px] w-[170px] items-center justify-center rounded-full bg-card">
        <WandIcon className="h-20 w-20 text-navy" />
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="max-w-[300px] text-[15px] leading-snug text-error">AI 辨識失敗：{error}</p>
          <button
            type="button"
            onClick={() => navigate('/search', { replace: true })}
            className="h-11 rounded-[50px] border border-black bg-white px-6 text-sm font-medium text-brown"
          >
            返回重試
          </button>
        </div>
      ) : (
        <>
          <div className="h-[15px] w-[290px] overflow-hidden rounded-[10px] bg-white">
            <div
              className="h-full rounded-[10px] bg-brown/70 transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="max-w-[300px] text-center text-[15px] leading-snug text-black/40">
            提示：AI 會自動標記類別，<br />您可以在下一步進行修正。
          </p>
        </>
      )}
    </div>
  )
}
