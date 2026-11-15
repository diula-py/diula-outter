import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CubesIcon, FolderIcon } from '../components/icons'
import { WireDialog, DialogTitle, DialogButton } from '../components/DialogKit'
import DesktopTopNav from '../components/DesktopTopNav'
import DesktopFooter from '../components/DesktopFooter'
import { asset } from '../lib/asset'
import { useAuth } from '../context/AuthContext'

function MenuButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[90px] w-full max-w-[350px] items-center justify-center gap-10 rounded-[50px] border border-black bg-card px-10 py-[30px] land:h-[72px] land:py-3
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
    <div className="flex flex-col items-center lg:block">
      {/* ======== 手機／手機橫放：維持原本版型，桌機（lg:）整個藏起來 ======== */}
      <div className="flex w-full flex-col items-center
                      land:grid land:grid-cols-[repeat(2,minmax(0,340px))] land:content-start land:items-start land:justify-center land:gap-x-7
                      lg:hidden">
        {/* 藍色 header 100px + logo 106×35，跟尋找／拾獲分頁同一套（設計稿 Group 17），切換分頁不跳動 */}
        <header className="safe-header flex w-full items-end justify-center rounded-b-[20px] bg-blue pb-[10px] [--header-h:100px]
                           land:col-span-full land:mx-[calc(50%-50vw)] land:w-screen land:[--header-h:76px]">
          <div className="flex h-[35px] w-[106px] items-center justify-center overflow-hidden">
            <img src={asset('/icons/diula-logo.png')} alt="DiuLa!" className="w-full" />
          </div>
        </header>

        {/* 使用者卡：350×190、置中、header 下 18；1px 咖啡框；頭像 70、間距 20、名稱 16/500、編號 12/500 行高 13（設計稿 Frame 74） */}
        <div className="mt-[18px] flex h-[190px] w-[calc(100%-43px)] max-w-[350px] flex-col items-center justify-center gap-5 rounded-[20px] border border-brown bg-card/50 px-5 py-[30px]
                        land:col-start-1 land:row-span-2 land:mt-[18px] land:h-auto land:w-full land:max-w-none land:gap-3 land:py-5 land:self-auto">
          <div className="flex h-[70px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-black bg-white">
            <img src={avatarSrc} alt="大頭貼" onError={() => setAvatarBroken(true)} className="h-full w-full object-cover" />
          </div>
          <div className="text-base font-medium">{displayName}</div>
          <div className="whitespace-nowrap text-xs font-medium leading-[13px]">{displayCode && `User ID：${displayCode}`}</div>
        </div>

        {/* 我的遺失物 / 我的拾獲物：350×90、置中、間距 20、距使用者卡 60（設計稿 Frame 27/28）。
            2026-11：使用者確認不需要這裡的「近2日遺失物快速看」卡片，整塊拿掉（含
            RecentLostQuickView／MatchThumb／打 /subscriptions/recent-matches 的邏輯）。
            ⚠ 尋找頁同名按鈕（HomePage.jsx FIND_ITEMS）目前還是導來 '/profile'，這裡拿掉後
            那顆按鈕等於點了只會到空白的個人頁——還沒決定要把這段邏輯搬到哪，先別自己接掉。 */}
        <div className="mt-[60px] flex w-full flex-col items-center gap-5 px-[21px]
                        land:col-start-2 land:mt-[18px] land:gap-[10px] land:px-0 land:self-auto">
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

        {/* 登出：110×40；底部連結：10/400 底線、每個寬 80（中心相距 80）。
            2026-11 照設計稿（Frame 29）上方間距改回各 30。 */}
        <button
          type="button"
          onClick={() => setConfirmLogout(true)}
          className="mt-[30px] ml-px h-10 w-[110px] rounded-[50px] border border-black bg-input text-base font-medium text-brown
                     land:col-start-2 land:mt-1 land:justify-self-center
                     transition hover:bg-[#ececec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          登出
        </button>
        <div className="mt-[30px] flex text-[10px] font-normal leading-[10px] text-brown [&>*]:w-20 [&>*]:text-center land:col-start-1 land:row-start-4 land:mt-1 land:justify-self-center">
          <a href="https://about.diula.co" target="_blank" rel="noopener noreferrer" className="underline">
            關於DiuLa!
          </a>
          {/* 常見問題（2026-11-16 開會定案：原本的「使用教學」連結改成 FAQ，使用教學放在 FAQ 頁裡） */}
          <button type="button" onClick={() => navigate('/faq')} className="underline">FAQ</button>
          <button type="button" onClick={() => navigate('/terms')} className="underline">服務條款</button>
          <button type="button" onClick={() => navigate('/privacy')} className="underline">隱私權政策</button>
        </div>
      </div>

      {/* ======== 桌機（lg:）：照 2026-11 Figma 桌機設計稿，上方導覽列＋雙卡片（我的歷史紀錄／使用者資料）＋登出＋頁尾 ======== */}
      <div className="hidden lg:flex lg:w-full lg:flex-col lg:items-center">
        <DesktopTopNav />

        <div className="mx-auto mt-16 flex w-full max-w-[1536px] flex-wrap items-start justify-center gap-16 px-12 box-border">
          <div className="flex w-[560px] max-w-full flex-col items-start gap-10 rounded-[48px] border border-brown bg-paper p-16 box-border">
            <div className="flex items-center gap-3">
              <CubesIcon className="h-8 w-8 shrink-0" />
              <h2 className="m-0 text-2xl font-normal text-brown">我的歷史紀錄</h2>
            </div>
            <div className="flex w-full flex-col gap-6">
              <MenuButton icon={<CubesIcon className="h-10 w-10 shrink-0" />} label="我的遺失物" onClick={() => navigate('/my/lost')} />
              <MenuButton icon={<FolderIcon className="h-10 w-10 shrink-0" />} label="我的拾獲物" onClick={() => navigate('/my/found')} />
            </div>
          </div>

          <div className="flex w-[560px] max-w-full flex-col items-center justify-center gap-8 rounded-[48px] border border-black bg-paper p-16 box-border">
            <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-black bg-white">
              <img src={avatarSrc} alt="大頭貼" onError={() => setAvatarBroken(true)} className="h-full w-full object-cover" />
            </div>
            <div className="text-2xl font-medium text-brown">{displayName}</div>
            <div className="text-base font-medium text-brown">{displayCode && `User ID：${displayCode}`}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfirmLogout(true)}
          className="mt-10 flex h-[70px] w-[560px] max-w-full items-center justify-center rounded-[50px] border border-black bg-input text-xl font-medium text-brown
                     transition hover:bg-[#ececec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          登出
        </button>
        <div className="mt-6 flex gap-6 text-sm font-normal text-brown [&>*]:underline">
          <a href="https://about.diula.co" target="_blank" rel="noopener noreferrer">關於DiuLa!</a>
          <button type="button" onClick={() => navigate('/faq')}>FAQ</button>
          <button type="button" onClick={() => navigate('/terms')}>服務條款</button>
          <button type="button" onClick={() => navigate('/privacy')}>隱私權政策</button>
        </div>

        <DesktopFooter />
      </div>

      {/* 登出確認彈窗（inner logout-modal：300×251）——手機／桌機共用同一個 */}
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
