import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AnalyzingScreen from '../components/AnalyzingScreen'
import { analyzeItem } from '../lib/api'
import { normalizeIdWording } from '../lib/text'

// 登錄拾獲物的 AI 辨識過場（證件類／非證件類共用）：拿圖去 AI 服務要標籤，
// 補進這筆拾獲物後交給「確認標籤」頁（/register/confirm），使用者確認後才寫進「我的拾獲物」（同 inner page-11）。
// 跟搜尋流程的 AiAnalyzingPage 不同——不比對、不去搜尋結果。
// AI 失敗也不擋登錄：只帶原本的基本標籤（證件別）進確認頁，讓使用者自己補。
export default function RegisterAnalyzingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const data = location.state || {}
  const item = data.item
  const [pct, setPct] = useState(0)

  useEffect(() => {
    // 直接開這個網址、沒有帶資料就退回登錄頁。
    if (!item) { navigate('/register/id', { replace: true }); return }

    let alive = true
    const grow = setInterval(() => setPct((p) => Math.min(90, p + (90 - p) * 0.08 + 0.3)), 200)

    // 有 AI 結果就合併標籤，沒有就用原本的基本標籤；一律進確認標籤頁。
    const finish = (extraTags) => {
      if (!alive) return
      clearInterval(grow)
      setPct(100)
      const tags = [...new Set([...(item.tags || []), ...extraTags])]
      setTimeout(() => navigate('/register/confirm', { replace: true, state: { item: { ...item, tags } } }), 350)
    }

    ;(async () => {
      try {
        const json = await analyzeItem({ text: normalizeIdWording(data.desc || ''), base64Image: data.base64Image || null })
        const tags = []
        for (const it of json.items || []) {
          if (it.sub_tag) tags.push(normalizeIdWording(it.sub_tag))
          for (const c of it.colors || []) tags.push(c)
        }
        finish(tags)
      } catch {
        // AI 掛了或沒認出東西 → 不擋登錄，用基本標籤存檔就好。
        finish([])
      }
    })()

    return () => { alive = false; clearInterval(grow) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnalyzingScreen pct={pct}>
      提示：AI 會自動標記類別，<br />您可以在下一步進行修正。
    </AnalyzingScreen>
  )
}
