import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { WandIcon } from '../components/icons'
import { addMyItem } from '../lib/items'
import { useAuth } from '../context/AuthContext'
import { aiApi } from '../lib/api'

const AI_API = aiApi('/analyze-item') // dev 走 /ext-ai proxy；prod 直連 Render AI

// 證件登錄的 AI 辨識過場：拿打碼後的圖去 AI 服務要標籤，補進這筆拾獲物後
// 存進「我的拾獲物」，再跳清單。跟搜尋流程的 AiAnalyzingPage 不同——不比對、不去搜尋結果。
// AI 失敗也不讓這筆消失：仍以證件別當基本標籤存檔（登錄本身在上一步已寫進後端）。
export default function RegisterAnalyzingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userId } = useAuth()
  const data = location.state || {}
  const item = data.item
  const [pct, setPct] = useState(6)

  useEffect(() => {
    // 直接開這個網址、沒有帶資料就退回登錄頁。
    if (!item) { navigate('/register/id', { replace: true }); return }

    let alive = true
    const grow = setInterval(() => setPct((p) => (p < 90 ? p + (90 - p) * 0.05 : p)), 250)

    // 有 AI 結果就合併標籤，沒有就用原本的基本標籤；最後一律存檔 + 進清單。
    const finish = async (extraTags) => {
      if (!alive) return
      clearInterval(grow)
      setPct(100)
      const tags = [...new Set([...(item.tags || []), ...extraTags])]
      try {
        await addMyItem('found', userId, { ...item, tags })
      } catch (e) {
        console.error('存進「我的拾獲物」失敗:', e)
      }
      setTimeout(() => navigate('/my/found', { replace: true }), 350)
    }

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
        await finish(tags)
      } catch {
        // AI 掛了或沒認出東西 → 不擋登錄，用基本標籤存檔就好。
        await finish([])
      }
    })()

    return () => { alive = false; clearInterval(grow) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col items-center justify-center gap-8 bg-[#cddcf0] px-10">
      <div className="flex h-[170px] w-[170px] items-center justify-center rounded-full bg-card">
        <WandIcon className="h-20 w-20 text-navy" />
      </div>
      <div className="h-[15px] w-[290px] overflow-hidden rounded-[10px] bg-white">
        <div
          className="h-full rounded-[10px] bg-brown/70 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="max-w-[300px] text-center text-[15px] leading-normal text-black/40">
        提示：AI 會自動標記類別，<br />完成後會存進「我的拾獲物」。
      </p>
    </div>
  )
}
