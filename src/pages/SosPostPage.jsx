import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CircleCheckIcon } from '../components/icons'
import { DetailHeader } from '../components/DetailKit'
import { WireDialog, DialogTitle, DialogButton } from '../components/DialogKit'
import PhotoMaskModal from '../components/PhotoMaskModal'
import { addMyItem } from '../lib/items'
import { useAuth } from '../context/AuthContext'
import { flask } from '../lib/api'
import { LOST_STATUS } from '../data/itemStatus'

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

export default function SosPostPage() {
  const navigate = useNavigate()
  const { userId } = useAuth()
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
      await addMyItem('lost', userId, {
        kind: 'threads',
        code: '#' + (json.post_id ? String(json.post_id).slice(-6) : Date.now().toString().slice(-6)),
        name: name.trim(),
        date,
        place: fullPlace,
        remark: note.trim(),
        tags: q.tags || [],
        image,
        status: LOST_STATUS.POSTED,
        thread_post_id: json.post_id,
        thread_post_url: json.permalink,
      })
      setResult(json)
      setStatus('success')
    } catch (e) {
      setError(`發布失敗：${e.message}`)
      setStatus('idle')
    }
  }

  // 步驟一（inner page-20）：全部絕對定位，座標直接抄 inner
  const label = 'absolute text-xs font-medium leading-3 text-brown'
  const pill = 'absolute box-border flex h-10 w-[340px] items-center px-[15px] py-[10px] text-xs font-normal'
  const fieldInput = 'h-5 w-full bg-transparent p-0 text-xs font-normal leading-5 text-brown outline-none placeholder:text-[#888]'

  return (
    <div className="pb-6">
      <DetailHeader
        title="幫你發Threads的協尋文"
        onBack={() => (step === 'preview' ? setStep('form') : navigate(-1))}
        height={109}
        titleTop={70}
        backLeft={25}
        backTop={62}
        backSize={35}
      />

      {/* 步驟一：填表單 */}
      {step === 'form' && (
        <div className="relative h-[660px] w-full">
          <div className="absolute left-[27px] top-5 box-border flex h-[60px] w-[340px] items-center rounded-[10px] bg-card px-[15px] py-[10px] text-xs font-medium leading-normal text-brown">
            照欄位填，系統會套用統一模版由 DiuLa 官方帳號 發佈到 Threads 協尋，你的個人帳號不會露出。
          </div>

          <div className={label} style={{ left: 27, top: 100 }}>物品名稱</div>
          <div className={`${pill} rounded-[50px] border border-black bg-input`} style={{ left: 27, top: 122 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldInput} />
          </div>

          <div className={label} style={{ left: 26, top: 172 }}>遺失日期</div>
          <div className={`${pill} rounded-[10px] bg-input`} style={{ left: 27, top: 198 }}>
            <span className="opacity-70">{(date || '').replaceAll('-', '/') || '--'}</span>
          </div>

          <div className={label} style={{ left: 27, top: 248 }}>遺失地點</div>
          <div className={`${pill} rounded-[10px] bg-input`} style={{ left: 28, top: 274 }}>
            <span className="opacity-70">{place || '--'}</span>
          </div>

          <div className={label} style={{ left: 27, top: 324 }}>詳細地點（選填）</div>
          <div className={`${pill} rounded-[50px] border border-black bg-input`} style={{ left: 27, top: 346 }}>
            <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="如：世新山洞口、景美站2號出口" className={fieldInput} />
          </div>

          <div className={label} style={{ left: 28, top: 396 }}>備註</div>
          <div className={`${pill} rounded-[50px] border border-black bg-input`} style={{ left: 28, top: 418 }}>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="如：對我很有紀念意義，謝謝大家幫忙留意" className={fieldInput} />
          </div>

          {error && <p className="absolute left-[27px] top-[466px] w-[340px] text-sm leading-normal text-error">{error}</p>}

          <button
            type="button"
            onClick={goPreview}
            className="absolute left-1/2 top-[488px] box-border flex h-[60px] w-[350px] -translate-x-1/2 items-center justify-center gap-[30px] rounded-[50px] border border-black bg-card px-10 py-[30px]
                       text-base font-medium text-brown transition hover:brightness-[.98]
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            <CircleCheckIcon className="h-10 w-10 shrink-0" />
            <span>填寫完成！查看貼文預覽</span>
          </button>
        </div>
      )}

      {/* 步驟二：貼文預覽 + 圖片預覽 + 實際發佈 */}
      {step === 'preview' && (
        <div className="flex flex-col gap-4 px-[26px] pt-5">
          <div className="rounded-[10px] bg-card p-4 text-xs font-medium leading-normal text-brown">
            由 <b>DiuLa！官方帳號</b> 幫你把協尋資訊發到 Threads，擴大協尋範圍。貼文圖片將沿用比對尋找時上傳的圖片！
            <b>會公開發到 Threads，發佈前可框住路人臉、車牌、地址等個資。</b>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-brown">貼文預覽</p>
            <pre className="whitespace-pre-wrap rounded-[10px] bg-input p-4 font-sans text-xs leading-normal text-brown">{text}</pre>
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

          {error && <p className="text-sm leading-normal text-error">{error}</p>}

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

      {/* 發布成功彈窗（inner notfound-thread-success：300×251） */}
      {status === 'success' && (
        <WireDialog height={251} onClose={() => navigate('/my/lost')} label="Threads串文已排定發佈">
          <DialogTitle top={87} width={246} lineHeight={22}>Threads串文已排定發佈！</DialogTitle>
          <DialogButton left={41} top={146} width={214} tone="blue" onClick={() => navigate('/my/lost')}>返回我的遺失物</DialogButton>
        </WireDialog>
      )}
    </div>
  )
}
