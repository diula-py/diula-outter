import { Outlet } from 'react-router-dom'
import TabBar from '../components/TabBar'

/**
 * 手機直向的外框：桌機上置中、限制最大寬度 393（design.md §5）。
 * 底部 TabBar 比照 inner：離視窗底部 40px（inner 的 bottom:20px 再加 margin-bottom:20px），並預留 iOS safe-area。
 */
export default function AppLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-paper">
      <main className="flex-1">
        <Outlet />
      </main>

      <div className="pointer-events-none sticky bottom-[calc(40px+env(safe-area-inset-bottom))] mb-[calc(40px+env(safe-area-inset-bottom))] mt-5 flex justify-center">
        <div className="pointer-events-auto">
          <TabBar />
        </div>
      </div>
    </div>
  )
}
