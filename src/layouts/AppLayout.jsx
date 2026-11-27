import { Outlet } from 'react-router-dom'
import TabBar from '../components/TabBar'
import OnboardingGate from '../components/OnboardingGate'

/**
 * 手機直向的外框：桌機上置中、限制最大寬度 393（design.md §5）。
 * 底部 TabBar：離視窗底部 20px（同比對結果頁「都沒有我的物品」膠囊），並預留 iOS safe-area。
 *
 * 2026-11 加桌機版（lg:）：393 的手機外框寬度限制在桌機要整個解除，不然裡面各頁
 * 自己做的桌機版型（上方導覽列＋Hero＋卡片，見 HomeTabPage／ProfilePage）會被這層
 * 外框硬壓回 393 寬。底部浮動 TabBar 在桌機也不需要，改用 DesktopTopNav。
 *
 * 2026-11 加平板版（md: 768~1023px，lg: 1024px 桌機版之前還沒人用過的空檔）：
 * 維持手機版的視覺／元件（不是另一套桌機設計），只是把 393 的寬度上限放寬到 700——
 * 跟 land:（手機橫放）已經在用的寬度一致，各頁面在 md: 也直接沿用 land: 同一組
 * 「變寬」class（2 欄 grid、max-w-[700px] 之類），但不要跟著套 land: 那些「矮螢幕
 * 縮高度」的 class（header 高度、藏裝飾圖）——平板直向高度很夠，不需要那些。
 */
export default function AppLayout() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] flex-col bg-paper land:max-w-none md:max-w-[700px] lg:max-w-none lg:min-h-screen">
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <div className="pointer-events-none sticky bottom-[calc(20px+env(safe-area-inset-bottom))] mb-[calc(20px+env(safe-area-inset-bottom))] mt-5 flex justify-center
                      land:bottom-[calc(10px+env(safe-area-inset-bottom))] land:mb-[calc(10px+env(safe-area-inset-bottom))] land:mt-2
                      lg:hidden">
        <div className="pointer-events-auto">
          <TabBar />
        </div>
      </div>

      {/* 新手教學：登入後第一次進來自動跳出，個人頁可以再打開 */}
      <OnboardingGate />
    </div>
  )
}
