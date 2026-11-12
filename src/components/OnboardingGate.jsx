import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { shouldShowOnboarding, markOnboardingSeen, onOpenOnboarding } from '../lib/onboarding'
import OnboardingTour from './OnboardingTour'

/**
 * 掛在 AppLayout（有底部 TabBar 的拾獲／尋找／個人三頁）：
 * - 登入後第一次進來、還沒看過教學 → 自動跳出（看過紀錄見 lib/onboarding.js）
 * - 個人頁「使用教學」連結呼叫 openOnboarding() → 隨時再打開一次
 * 按「跳過」或「開始使用」都算看過。
 */
export default function OnboardingGate() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    shouldShowOnboarding(user).then((show) => {
      if (!cancelled && show) setOpen(true)
    })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => onOpenOnboarding(() => setOpen(true)), [])

  if (!open) return null
  return (
    <OnboardingTour
      onClose={() => {
        setOpen(false)
        markOnboardingSeen(user)
      }}
    />
  )
}
