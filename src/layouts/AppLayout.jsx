import { Outlet } from 'react-router-dom'
import TabBar from '../components/TabBar'
import OnboardingGate from '../components/OnboardingGate'

/**
 * 手機直向的外框：桌機上置中、限制最大寬度 393（design.md §5）。
 * 底部 TabBar：離視窗底部 20px（同比對結果頁「都沒有我的物品」膠囊），並預留 iOS safe-area。
 */
export default function AppLayout() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col bg-paper land:max-w-none">
      <main className="flex-1">
        <Outlet />
      </main>

      <div className="pointer-events-none sticky bottom-[calc(20px+env(safe-area-inset-bottom))] mb-[calc(20px+env(safe-area-inset-bottom))] mt-5 flex justify-center
                      land:bottom-[calc(10px+env(safe-area-inset-bottom))] land:mb-[calc(10px+env(safe-area-inset-bottom))] land:mt-2">
        <div className="pointer-events-auto">
          <TabBar />
        </div>
      </div>

      {/* 新手教學：登入後第一次進來自動跳出，個人頁可以再打開 */}
      <OnboardingGate />
    </div>
  )
}
