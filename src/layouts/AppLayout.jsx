import { Outlet } from 'react-router-dom'
import TabBar from '../components/TabBar'

/**
 * 手機直向的外框：桌機上置中、限制最大寬度（模擬手機），
 * 底部 TabBar 貼底（sticky），並預留 iOS safe-area。
 */
export default function AppLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-base">
      <main className="flex-1">
        <Outlet />
      </main>

      <div className="sticky bottom-0 bg-base px-6 pt-2 pb-[calc(env(safe-area-inset-bottom)+22px)]">
        <TabBar />
      </div>
    </div>
  )
}
