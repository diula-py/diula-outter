import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CubesIcon, FolderIcon, UserRegularIcon } from '../components/icons'

// TODO: 接登入／使用者 API 後換成真實資料。目前為設計稿範例值。
const USER = { name: '張寧寧', code: 'G26043F2W' }

function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" strokeWidth="4" strokeLinecap="round" {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

function MenuButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[100px] w-full items-center justify-center gap-10 rounded-[50px]
                 border border-black bg-card text-base font-medium text-brown
                 transition hover:bg-[#eee8d7] active:scale-[.99]
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)

  return (
    <div>
      {/* 藍色 header + logo */}
      <header className="flex h-[109px] items-end justify-center rounded-b-[20px] bg-blue pb-5 pt-[env(safe-area-inset-top)]">
        {/* TODO: 換成正式 logo 素材（DiuLa! 去背 PNG）。目前為文字 placeholder。 */}
        <span className="text-[30px] font-bold tracking-wide text-brown">DiuLa!</span>
      </header>

      <div className="flex flex-col gap-5 px-[18px] pt-4">
        {/* 使用者卡 */}
        <div className="flex flex-col items-center gap-4 rounded-[20px] bg-card/50 px-6 py-8">
          <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full border border-black bg-white">
            <UserRegularIcon className="h-10 w-10 text-navy" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-base font-medium text-brown">{USER.name}</span>
            <span className="text-xs font-medium text-brown">用戶編號：{USER.code}</span>
          </div>
        </div>

        {/* 我的遺失物 / 我的拾獲物 */}
        <div className="flex flex-col gap-5 px-1">
          <MenuButton
            icon={<CubesIcon className="h-10 w-10 text-navy" />}
            label="我的遺失物"
            onClick={() => navigate('/my/lost')}
          />
          <MenuButton
            icon={<FolderIcon className="h-10 w-10 text-navy" />}
            label="我的拾獲物"
            onClick={() => navigate('/my/found')}
          />
        </div>

        {/* 登出 + 關於 */}
        <div className="mt-1 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="h-10 rounded-[50px] border border-black bg-input px-8 text-base font-medium text-brown
                       transition hover:bg-[#ececec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
          >
            登出
          </button>
          <button
            type="button"
            onClick={() => navigate('/about')}
            className="text-xs font-medium text-black underline underline-offset-2"
          >
            關於DiuLa!
          </button>
        </div>
      </div>

      {/* 登出確認彈窗 */}
      {confirmLogout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="是否要登出"
            className="relative w-full max-w-[300px] rounded-[10px] bg-card px-8 py-10 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setConfirmLogout(false)}
              aria-label="關閉"
              className="absolute left-3 top-3 p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <CloseIcon className="h-[26px] w-[26px]" />
            </button>

            <p className="mt-2 text-center text-xl font-medium text-brown">是否要登出呢？：(</p>

            <div className="mt-7 flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="h-[60px] w-[90px] rounded-[50px] border border-black bg-white text-xl font-medium text-brown
                           transition hover:bg-[#f4f4f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
              >
                是
              </button>
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="h-[60px] w-[90px] rounded-[50px] border border-black bg-blue text-xl font-medium text-brown
                           transition hover:brightness-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
              >
                否
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
