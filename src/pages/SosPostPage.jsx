import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, CircleCheckIcon } from '../components/icons'
import PhotoMaskModal from '../components/PhotoMaskModal'
import { addItem } from '../lib/myItems'
import { flask } from '../lib/api'

// Threads 抓外部圖有下載逾時上限，原始手機照太大會 2207003（下載逾時）→ 先縮圖再送。
function downscale(dataUrl, maxSide = 1280, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      ctx.fillStyle = '#ffffff' // JPEG 無透明，先鋪白底避免透明區變黑
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      try { resolve(c.toDataURL('image/jpeg', quality)) } catch { resolve(dataUrl) }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// 文案模版（對齊設計稿預覽頁）
function buildText({ name, date, place, note }) {
  return [
    `🔍協尋遺失物：${name || '（未填）'}`,
    `📅遺失日期：${(date || '').replaceAll('-', '/') || '（未填）'}`,
    `📍遺失地點：${place || '（未填）'}`,
    ...(note ? [`📝${note}`] : []),
    '若您拾獲，請私訊 DiuLa 官方帳號🙏',
    '#協尋 #遺失物 #DiuLa',
  ].join('\n')
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="3" strokeLinecap="round" {...props}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  )
}

export default function SosPostPage() {
  const navigate = useNavigate()
  const state = useLocation().state || {}
  const q = state.query || {}
  const rawImage = state.base64Image || null // 預覽直接用原圖；送出時才縮圖

  const [editedImage, setEditedImage] = useState(null) // 打碼後的圖（有的話優先用）
  const [maskOpen, setMaskOpen] = useState(false)
  const displayImage = editedImage || rawImage         // 預覽／送出都用這張

  const date = q.date || ''    // 鎖死：來自比對條件
  const place = q.place || ''   // 鎖死：來自比對條件

  const [name, setName] = useState((q.tags && q.tags.join('、')) || '')
  const [detail, setDetail] = useState('') // 詳細遺失地點（選填）
  const [note, setNote] = useState('')     // 備註（選填）
  const [step, setStep] = useState('form') // form | preview
  const [status, setStatus] = useState('idle') // idle | submitting | success
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  function goPreview() {
    setError('')
    if (!name.trim()) { setError('請填物品名稱'); return }
    setStep('preview')
  }

  const fullPlace = [place, detail.trim()].filter(Boolean).join(' ')
  const text = buildText({ name, date, place: fullPlace, note: note.trim() })

  async function submit() {
    setError('')
    if (!name.trim()) { setError('請填物品名稱'); return }
    setStatus('submitting')
    try {
      // 送出當下才縮圖，保證不會送到還沒縮的原圖（Threads 抓大圖會逾時 2207003）。
      // 有打碼就送打碼後的圖，原圖不外流。
      const image = displayImage ? await downscale(displayImage) : null
      const res = await fetch(flask('/threads/submit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, image, name, lost_date: date, location: fullPlace }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      // 存進「我的遺失物」本機紀錄，讓發出去的協尋出現在清單。
      addItem({
        id: 'sos_' + Date.now(),
        kind: 'threads',
        code: '#' + (json.post_id ? String(json.post_id).slice(-6) : Date.now().toString().slice(-6)),
        name: name.trim(),
        date,
        place: fullPlace,
        remark: note.trim(),
        tags: q.tags || [],
        image,
        status: '自動推播中',
        thread_post_id: json.post_id,
        thread_post_url: json.permalink,
        created_at: new Date().toISOString(),
      })
      setResult(json)
      setStatus('success')
    } catch (e) {
      setError(`發布失敗：${e.message}`)
      setStatus('idle')
    }
  }

  // 可編輯欄位（pill）／唯讀欄位（帶入比對條件，不可改）
  const editBox = 'h-10 w-full rounded-[50px] border border-black bg-input px-4 text-xs text-brown outline-none placeholder:text-brown/50'
  const lockedBox = 'flex h-10 w-full items-center rounded-[10px] bg-input px-4 text-xs text-brown/70'
  const labelClass = 'mb-1.5 block text-xs font-medium text-brown'

  return (
    <div className="pb-6">
      <header className="relative flex h-[90px] items-end justify-center rounded-b-[20px] bg-card pb-4 pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={() => (step === 'preview' ? setStep('form') : navigate(-1))} aria-label="返回"
          className="absolute bottom-4 left-[22px] p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
          <ChevronLeftIcon className="h-[26px] w-[26px] text-brown" />
        </button>
        <h1 className="text-xl font-bold text-brown">幫你發Threads的協尋文</h1>
      </header>

      {/* 步驟一：填表單 */}
      {step === 'form' && (
        <div className="flex flex-col gap-4 px-[26px] pt-5">
          <div className="rounded-[10px] bg-card p-4 text-xs font-medium leading-relaxed text-brown">
            照欄位填，系統會套用統一模版由 <b>DiuLa 官方帳號</b> 發佈到 Threads 協尋，你的個人帳號不會露出。
          </div>

          <div>
            <label className={labelClass}>物品名稱
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="皮夾 / 錢包" className={`mt-1.5 ${editBox}`} />
            </label>
          </div>
          <div>
            <p className={labelClass}>遺失日期</p>
            <div className={lockedBox}>{(date || '').replaceAll('-', '/') || '—'}</div>
          </div>
          <div>
            <p className={labelClass}>遺失地點</p>
            <div className={lockedBox}>{place || '—'}</div>
          </div>
          <div>
            <label className={labelClass}>詳細地點（選填）
              <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="如：世新山洞口、景美站2號出口" className={`mt-1.5 ${editBox}`} />
            </label>
          </div>
          <div>
            <label className={labelClass}>備註
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="如：對我很有紀念意義，謝謝大家幫忙留意" className={`mt-1.5 ${editBox}`} />
            </label>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button type="button" onClick={goPreview}
            className="mt-2 flex h-[60px] w-full items-center justify-center gap-3 rounded-[50px] border border-black bg-card
                       text-base font-medium text-brown transition hover:bg-[#eee8d7]
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
            <CircleCheckIcon className="h-9 w-9 shrink-0 text-brown" />
            填寫完成！查看貼文預覽
          </button>
        </div>
      )}

      {/* 步驟二：貼文預覽 + 圖片預覽 + 實際發佈 */}
      {step === 'preview' && (
        <div className="flex flex-col gap-4 px-[26px] pt-5">
          <div className="rounded-[10px] bg-card p-4 text-xs font-medium leading-[20px] text-brown">
            由 <b>DiuLa！官方帳號</b> 幫你把協尋資訊發到 Threads，擴大協尋範圍。貼文圖片將沿用比對尋找時上傳的圖片！
            <b>會公開發到 Threads，發佈前可框住路人臉、車牌、地址等個資。</b>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-brown">貼文預覽</p>
            <pre className="whitespace-pre-wrap rounded-[10px] bg-input p-4 font-sans text-xs leading-[15px] text-brown">{text}</pre>
          </div>

          {displayImage && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-medium text-brown">圖片預覽</p>
                <button
                  type="button"
                  onClick={() => setMaskOpen(true)}
                  className="rounded-full border border-black bg-input px-3 py-1 text-xs font-medium text-brown
                             transition hover:bg-[#ececec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
                >
                  {editedImage ? '重新打碼' : '為圖片打碼'}
                </button>
              </div>
              <img src={displayImage} alt="協尋照片" className="w-full rounded-[10px] object-cover" />
            </div>
          )}

          {error && <p className="text-sm text-error">{error}</p>}

          <button type="button" onClick={submit} disabled={status === 'submitting'}
            className="mt-2 flex h-[60px] w-full items-center justify-center gap-3 rounded-[50px] border border-black bg-card
                       text-base font-medium text-brown transition hover:bg-[#eee8d7] disabled:opacity-50
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
            <CircleCheckIcon className="h-9 w-9 shrink-0 text-brown" />
            {status === 'submitting' ? '發布中…' : '確認！發佈此則Threads文'}
          </button>
        </div>
      )}

      {/* 圖片打碼視窗（一律以原圖為底，重開＝從頭打碼，可還原） */}
      {maskOpen && rawImage && (
        <PhotoMaskModal
          src={rawImage}
          onCancel={() => setMaskOpen(false)}
          onConfirm={(url) => { setEditedImage(url); setMaskOpen(false) }}
        />
      )}

      {/* 發布成功彈窗 */}
      {status === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-6">
          <div className="relative w-[300px] rounded-[10px] bg-card px-6 pb-8 pt-14 shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
            <button
              type="button"
              onClick={() => navigate('/my/lost')}
              aria-label="關閉"
              className="absolute left-4 top-4 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <XIcon className="h-6 w-6" />
            </button>
            <p className="mb-7 text-center text-xl font-medium text-brown">Threads串文已排定發佈！</p>
            <button
              type="button"
              onClick={() => navigate('/my/lost')}
              className="h-[60px] w-full rounded-[50px] border border-black bg-blue text-xl font-medium text-brown
                         transition hover:brightness-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              返回我的遺失物
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
