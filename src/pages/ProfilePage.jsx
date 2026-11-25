import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CubesIcon, FolderIcon, UserRegularIcon } from '../components/icons'
import { WireDialog, DialogTitle, DialogButton } from '../components/DialogKit'
import DesktopTopNav from '../components/DesktopTopNav'
import DesktopFooter from '../components/DesktopFooter'
import SectionTitle from '../components/SectionTitle'
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
    <div className="flex flex-1 flex-col items-center lg:block">
      {/* ======== 手機／手機橫放：維持原本版型，桌機（lg:）整個藏起來 ======== */}
      <div className="flex flex-1 w-full flex-col items-center
                      land:grid land:grid-cols-[repeat(2,minmax(0,340px))] land:content-start land:items-start land:justify-center land:gap-x-7
                      md:grid md:grid-cols-[repeat(2,minmax(0,340px))] md:content-start md:items-start md:justify-center md:gap-x-7
                      lg:hidden">
        {/* 藍色 header 100px + logo 106×35，跟尋找／拾獲分頁同一套（設計稿 Group 17），切換分頁不跳動 */}
        <header className="safe-header flex w-full items-end justify-center rounded-b-[20px] bg-blue pb-[10px] [--header-h:100px]
                           land:col-span-full land:mx-[calc(50%-50vw)] land:w-screen land:[--header-h:76px]
                           md:col-span-full md:mx-[calc(50%-50vw)] md:w-screen">
          <div className="flex h-[35px] w-[106px] items-center justify-center overflow-hidden">
            <img src={asset('/icons/diula-logo.png')} alt="DiuLa!" className="w-full" />
          </div>
        </header>

        {/* 使用者卡：350×190、置中、header 下 18；1px 咖啡框；頭像 70、間距 20、名稱 16/500、編號 12/500 行高 13（設計稿 Frame 74） */}
        <div className="mt-[18px] flex h-[190px] w-[calc(100%-43px)] max-w-[350px] flex-col items-center justify-center gap-5 rounded-[20px] border border-brown bg-card/50 px-5 py-[30px]
                        land:col-start-1 land:mt-[18px] land:h-auto land:w-full land:max-w-none land:gap-3 land:py-5 land:self-auto
                        md:col-start-1 md:h-auto md:w-full md:max-w-none md:self-auto">
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
        {/* 2026-11-20：補上跟電腦版一樣的「我的歷史紀錄」標題，形式同尋找／拾獲分頁的 SectionTitle
            （不放問號鈕）。間距照那兩頁：卡片下 25 放標題、標題下 15 接按鈕（原本卡片到按鈕 60）。 */}
        <div className="mt-[25px] flex w-full flex-col items-center px-[21px]
                        land:col-start-2 land:mt-[18px] land:px-0 land:self-auto md:col-start-2 md:self-auto">
          <div className="w-full max-w-[350px]">
            <SectionTitle>我的歷史紀錄</SectionTitle>
          </div>
          <div className="mt-[15px] flex w-full flex-col items-center gap-5 land:gap-[10px]">
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
        </div>

        {/* 登出：110×40；底部連結：10/400 底線、每個寬 80（中心相距 80）。
            2026-11 照設計稿（Frame 29）上方間距改回各 30。 */}
        <button
          type="button"
          onClick={() => setConfirmLogout(true)}
          className="mt-[30px] ml-px h-10 w-[110px] rounded-[50px] border border-black bg-input text-base font-medium text-brown
                     land:col-start-2 land:mt-1 land:justify-self-center md:col-start-2 md:justify-self-center
                     transition hover:bg-[#ececec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
        >
          登出
        </button>
        {/* 底部連結：mt-auto 讓手機直向(上面那層已改 min-h-full 撐滿畫面)在內容短時
            貼到 TabBar 正上方，不會跟登出按鈕之間留一大截空白；橫放(land:)維持原本
            排版用 grid 第 4 列定位，不受影響。
            2026-11-21：字 10 → 12px、行高 10 → 16px，每個連結上下各加 8px padding 讓可點高度
            約 32px；上方 pt 30 → 22 抵掉多出來的 padding，跟登出鈕的距離維持差不多。
            2026-11-23：橫放時原本這排自己佔第 4 列，頁面比畫面高、一進來剛好被浮動 TabBar 擋住。
            改成放在使用者卡正下方（第 3 列，跟登出鈕同一列、上緣對齊；使用者卡不再 row-span-2），
            橫放的上下 padding 8 → 4px，整排落在 TabBar 上方。直式不受影響。 */}
        <div className="mt-auto flex pt-[22px] text-[12px] font-normal leading-4 text-brown [&>*]:w-20 [&>*]:py-2 [&>*]:text-center land:col-start-1 land:row-start-3 land:mt-1 land:pt-0 land:self-start land:justify-self-center land:[&>*]:py-1 md:col-start-1 md:row-start-3 md:self-start md:justify-self-center">
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
            {/* icon 跟首頁桌機版兩張卡片同一個規則（卡片標題 icon＝該分類在手機版 TabBar
                的那個 icon）：個人對應的是 user.png，不是跟下面「我的遺失物」按鈕重複的
                CubesIcon。 */}
            <div className="flex items-center gap-3">
              <UserRegularIcon className="h-8 w-8 shrink-0" />
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
        {/* 底下這排連結拿掉：DesktopFooter 本來就有隱私權政策／服務條款／關於我們，
            兩排疊在一起是重複資訊，FAQ 改併進 DesktopFooter 裡（見該檔案）。 */}
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
