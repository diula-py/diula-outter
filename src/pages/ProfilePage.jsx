import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CubesIcon, FolderIcon } from '../components/icons'
import { WireDialog, DialogTitle, DialogButton } from '../components/DialogKit'
import { asset } from '../lib/asset'
import { useAuth } from '../context/AuthContext'

function MenuButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[100px] w-[350px] items-center justify-center gap-10 rounded-[50px] border border-black bg-card px-10 py-[30px]
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

  const displayName = user?.displayName || '訪客'
  const displayCode = user?.userId || ''

  async function handleConfirmLogout() {
    await logout()
    setConfirmLogout(false)
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col items-center">
      {/* 藍色 header 109px + logo 106×35（比照 inner page-14） */}
      <header className="flex h-[109px] w-full items-end justify-center rounded-b-[20px] bg-blue pb-[10px] pt-[env(safe-area-inset-top)]">
        <div className="flex h-[35px] w-[106px] items-center justify-center overflow-hidden">
          <img src={asset('/icons/diula-logo.png')} alt="DiuLa!" className="w-full" />
        </div>
      </header>

      {/* 使用者卡：360×200、x=18、y=129；頭像 72、間距 20、名稱 16/500、編號 12/500 */}
      <div className="mt-5 flex h-[200px] w-[360px] flex-col items-center justify-center gap-5 self-start rounded-[20px] bg-card/50 px-[115px] py-[30px] ml-[18px]">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-black bg-white">
          <img src={user?.photoURL || asset('/icons/avatar.png')} alt="大頭貼" className="h-full w-full object-cover" />
        </div>
        <div className="text-base font-medium">{displayName}</div>
        <div className="whitespace-nowrap text-xs font-medium">{displayCode}</div>
      </div>

      {/* 我的遺失物 / 我的拾獲物：350×100、x=22、y=351／471 */}
      <div className="mt-[22px] flex flex-col gap-5 self-start pl-[22px]">
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

      {/* 登出：110×40，y=601；關於：12/500 底線，y=671 */}
      <button
        type="button"
        onClick={() => setConfirmLogout(true)}
        className="mt-[30px] ml-px h-10 w-[110px] rounded-[50px] border border-black bg-input text-base font-medium text-brown
                   transition hover:bg-[#ececec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
      >
        登出
      </button>
      <button
        type="button"
        onClick={() => navigate('/about')}
        className="mt-[30px] ml-[3px] text-xs font-medium text-black underline"
      >
        關於DiuLa!
      </button>

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
