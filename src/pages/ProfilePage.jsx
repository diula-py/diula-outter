import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, CubesIcon, FolderIcon } from '../components/icons'
import { WireDialog, DialogTitle, DialogButton } from '../components/DialogKit'
import { asset } from '../lib/asset'
import { useAuth } from '../context/AuthContext'
import { flask, apiFetch, wakeFlask } from '../lib/api'
import { getAuthHeaders } from '../lib/authToken'
import { itemTitle } from '../lib/text'
import { friendlyError } from '../lib/errors'

const fmtDate = (s) => (s ? String(s).slice(0, 10).replaceAll('-', '/') : '')

// 跟 ResultsPage 的 ResultThumb 同邏輯：image_ref 不是 https 網址（本機路徑、空字串）就用預設圖。
function MatchThumb({ src }) {
  const [broken, setBroken] = useState(false)
  const ok = src && /^https?:\/\//.test(src) && !broken
  return (
    <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-white">
      {ok
        ? <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
        : <img src={asset('/icons/logo2.png')} alt="" className="h-full w-full object-contain" />}
    </div>
  )
}

// 顯示「我還在自動推播中的協尋，近2天內新出現、接下來會透過 Email／LINE 通知我」的命中，
// 不是「我自己登錄的遺失物」——資料來自 /subscriptions/recent-matches（即時重跑一次 /match，
// 跟每日排程推播同一套邏輯與門檻，只是現在查給使用者看）。見 diula-outter/flask_app.py。
function RecentLostQuickView() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    wakeFlask()
    getAuthHeaders().then((headers) => {
      if (!headers) throw new Error('尚未登入')
      return apiFetch(flask('/subscriptions/recent-matches'), { headers })
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
      return res.json()
    }).then((json) => {
      if (alive) setMatches(json.matches || [])
    }).catch((e) => {
      // 次要功能：查不到就安靜當作沒有，不要用紅字嚇到使用者——後端睡著、
      // 配額見底、限流都可能發生，次數不多也不值得重試（詳情頁有真的錯誤訊息可看）。
      console.warn('讀取近2日遺失物命中失敗：', friendlyError(e))
    }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return (
    <div className="flex w-full max-w-[350px] flex-col gap-3 rounded-[20px] border border-black bg-card/50 p-4 land:max-w-none">
      <h2 className="text-sm font-bold text-brown">近2日遺失物</h2>
      {loading && <p className="text-xs text-[#888]">載入中...</p>}
      {!loading && !matches.length && <p className="text-xs text-[#888]">最近2天沒有新的相符失物</p>}
      {!!matches.length && (
        <div className="flex flex-col gap-2">
          {matches.map((m) => {
            const it = m.item || {}
            const rid = it.external_id || m.id
            return (
              <button
                key={rid}
                type="button"
                onClick={() => navigate(`/search/results/${rid}`, { state: { item: it } })}
                className="flex w-full items-center gap-2 rounded-[10px] border border-black bg-card p-2 text-left text-brown
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
              >
                <MatchThumb src={it.image_ref} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
                  <div className="truncate text-xs font-bold">{itemTitle(it) || m.category_name || '失物'}</div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span>{[it.city, it.district].filter(Boolean).join('') || '—'}</span>
                    <span>{fmtDate(it.found_date)}</span>
                    <span className="text-brown/60">相符 {Math.round((m.score || 0) * 100)}%</span>
                  </div>
                </div>
                <ChevronLeftIcon className="h-4 w-4 shrink-0 -scale-x-100" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MenuButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[100px] w-full max-w-[350px] items-center justify-center gap-10 rounded-[50px] border border-black bg-card px-10 py-[30px] land:h-[72px] land:py-3
                 text-base font-medium text-brown transition hover:bg-[#eee8d7] active:scale-[.99]
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
    >
      {icon}
      <span className="w-20 text-center">{label}</span>
    </button>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [confirmLogout, setConfirmLogout] = useState(false)
  // LINE / Google 頭貼是外部網址，離線或過期會抓不到 → 改顯示預設頭貼
  const [avatarBroken, setAvatarBroken] = useState(false)
  const avatarSrc = user?.photoURL && !avatarBroken ? user.photoURL : asset('/icons/icon_profile.png')

  const displayName = user?.displayName || '訪客'
  const displayCode = user?.userId || ''

  async function handleConfirmLogout() {
    await logout()
    setConfirmLogout(false)
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col items-center
                    land:grid land:grid-cols-[repeat(2,minmax(0,340px))] land:content-start land:items-start land:justify-center land:gap-x-7">
      {/* 藍色 header 109px + logo 106×35（比照 inner page-14） */}
      <header className="safe-header flex w-full items-end justify-center rounded-b-[20px] bg-blue pb-[10px] [--header-h:109px]
                         land:col-span-full land:mx-[calc(50%-50vw)] land:w-screen land:[--header-h:76px]">
        <div className="flex h-[35px] w-[106px] items-center justify-center overflow-hidden">
          <img src={asset('/icons/diula-logo.png')} alt="DiuLa!" className="w-full" />
        </div>
      </header>

      {/* 使用者卡：360×200、x=18、y=129（窄螢幕右側留 15、跟著縮短）；頭像 72、間距 20、名稱 16/500、編號 12/500 */}
      <div className="mt-5 flex h-[200px] w-[calc(100%-33px)] max-w-[360px] flex-col items-center justify-center gap-5 self-start rounded-[20px] bg-card/50 px-5 py-[30px] ml-[18px]
                      land:col-start-1 land:row-span-2 land:mt-[18px] land:ml-0 land:h-auto land:w-full land:max-w-none land:gap-3 land:py-5 land:self-auto">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-black bg-white">
          <img src={avatarSrc} alt="大頭貼" onError={() => setAvatarBroken(true)} className="h-full w-full object-cover" />
        </div>
        <div className="text-base font-medium">{displayName}</div>
        <div className="whitespace-nowrap text-xs font-medium">{displayCode && `User ID：${displayCode}`}</div>
      </div>

      {/* 近2日遺失物快速看 + 我的遺失物 / 我的拾獲物：350×100、x=22、y=351／471（窄螢幕右側留 21、跟著縮短） */}
      <div className="mt-[22px] flex w-full flex-col gap-5 self-start pl-[22px] pr-[21px]
                      land:col-start-2 land:mt-[18px] land:gap-[10px] land:px-0 land:self-auto">
        <RecentLostQuickView />
        <MenuButton
          icon={<CubesIcon className="h-10 w-10 shrink-0" />}
          label="我的遺失物"
          onClick={() => navigate('/my/lost')}
        />
        <MenuButton
          icon={<FolderIcon className="h-10 w-10 shrink-0" />}
          label="我的拾獲物"
          onClick={() => navigate('/my/found')}
        />
      </div>

      {/* 登出：110×40；關於／服務條款／隱私權政策：12/500 底線。
          上方間距原本照 inner 各 30，iPhone 14 Pro 主畫面 App 內容超出一點，黏在底部的 TabBar 會壓到連結（只剩 7px）；
          改成各 20（design.md 元件間距），整頁一個畫面放得下，連結距 TabBar 27px。 */}
      <button
        type="button"
        onClick={() => setConfirmLogout(true)}
        className="mt-5 ml-px h-10 w-[110px] rounded-[50px] border border-black bg-input text-base font-medium text-brown
                   land:col-start-2 land:mt-1 land:justify-self-center
                   transition hover:bg-[#ececec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
      >
        登出
      </button>
      <div className="mt-5 ml-[3px] flex gap-5 text-xs font-medium text-brown land:col-start-1 land:row-start-4 land:mt-1 land:justify-self-center">
        <a href="https://about.diula.co" target="_blank" rel="noopener noreferrer" className="underline">
          關於DiuLa!
        </a>
        <button type="button" onClick={() => navigate('/terms')} className="underline">服務條款</button>
        <button type="button" onClick={() => navigate('/privacy')} className="underline">隱私權政策</button>
      </div>

      {/* 登出確認彈窗（inner logout-modal：300×251） */}
      {confirmLogout && (
        <WireDialog height={251} onClose={() => setConfirmLogout(false)} label="是否要登出">
          <DialogTitle top={99} width={168}>是否要登出呢？</DialogTitle>
          <DialogButton left={41} top={146} width={90} onClick={handleConfirmLogout}>是</DialogButton>
          <DialogButton left={170} top={146} width={90} tone="blue" onClick={() => setConfirmLogout(false)}>否</DialogButton>
        </WireDialog>
      )}
    </div>
  )
}
