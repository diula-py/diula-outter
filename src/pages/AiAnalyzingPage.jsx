import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AnalyzingScreen from '../components/AnalyzingScreen'

import { analyzeItem } from '../lib/api'
import { normalizeIdWording } from '../lib/text'

// AI 圖片辨識過場：實際呼叫 AI 服務，拿回標籤才進確認頁。
// Render 免費方案冷啟動可能要 ~1 分鐘，進度條期間慢慢爬到 90%，回來才補到 100%。
export default function AiAnalyzingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const data = location.state || {}
  const [pct, setPct] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    const grow = setInterval(() => setPct((p) => Math.min(90, p + (90 - p) * 0.08 + 0.3)), 200)

    ;(async () => {
      try {
        const json = await analyzeItem({ text: normalizeIdWording(data.desc || ''), base64Image: data.base64Image || null })

        const tags = []
        for (const it of json.items || []) {
          if (it.sub_tag) tags.push(normalizeIdWording(it.sub_tag))
          for (const c of it.colors || []) tags.push(c)
        }
        const uniq = [...new Set(tags)]
        if (!uniq.length) throw new Error('AI 沒認出東西，換張清楚一點的照片或改用文字描述')

        const first = (json.items || [])[0] || {}
        const name = `${(first.colors && first.colors[0]) || ''}${normalizeIdWording(first.sub_tag || '')}` || '確認標籤'

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
    <AnalyzingScreen pct={pct} error={error} onRetry={() => navigate('/search', { replace: true })}>
      提示：AI 會自動標記類別，<br />您可以在下一步進行修正。
    </AnalyzingScreen>
  )
}
