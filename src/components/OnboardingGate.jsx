import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { shouldShowOnboarding, markOnboardingSeen, onOpenOnboarding } from '../lib/onboarding'
import { isSeen, loadSeen, markSeen, onOpenTour } from '../lib/tours'
import { TOURS, TOUR_BY_PATH } from '../lib/tabTours'
import OnboardingTour from './OnboardingTour'
import SpotlightTour from './SpotlightTour'

/**
 * 掛在 AppLayout（有底部 TabBar 的拾獲／尋找／個人三頁），管三個使用教學什麼時候出現：
 *
 * 1. 第一個使用教學（全螢幕卡片）：登入後第一次進來、還沒看過 → 自動跳出（紀錄見 lib/onboarding.js）。
 *    openOnboarding() 也能隨時再打開。按「跳過」或「開始使用」都算看過。
 * 2. 尋找／拾獲使用教學（聚光燈導覽，2026-11-16 定案）：
 *    - 第一次進到「尋找」（'/'）或「拾獲」（'/found'）分頁時跳一次（紀錄見 lib/tours.js）。
 *    - 第一個使用教學結束後，如果人在「尋找」分頁，直接接上尋找使用教學。
 *    - 標題旁的問號鈕（openTour）、FAQ 頁（帶 location.state.tour 導過來）可以重看。
 *    第一個使用教學還沒判斷完、帳號上的看過紀錄還沒同步完（都要等 Firestore）之前不跳。
 */
export default function OnboardingGate() {
  const { user } = useAuth()
  const { pathname, state } = useLocation()
  const navigate = useNavigate()
  const uid = user?.uid
  const [firstOpen, setFirstOpen] = useState(false)
  const [firstChecked, setFirstChecked] = useState(false)
  const [tour, setTour] = useState(null)
  const [seenOk, setSeenOk] = useState(false) // 帳號上的看過紀錄同步好了

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setFirstChecked(false)
    shouldShowOnboarding(user).then((show) => {
      if (cancelled) return
      if (show) setFirstOpen(true)
      setFirstChecked(true)
    })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!uid) return
    let cancelled = false
    setSeenOk(false)
    loadSeen(uid).then((ok) => { if (!cancelled) setSeenOk(ok) })
    return () => { cancelled = true }
  }, [uid])

  useEffect(() => onOpenOnboarding(() => setFirstOpen(true)), [])
  useEffect(() => onOpenTour((name) => { if (TOURS[name]) setTour(name) }), [])

  // 從 FAQ 頁「重新觀看」導過來：開對應的導覽，並把 state 清掉，免得按返回又跳一次
  useEffect(() => {
    if (state?.tour && TOURS[state.tour]) {
      setTour(state.tour)
      navigate(pathname, { replace: true, state: null })
    }
  }, [state, pathname, navigate])

  // 第一次進到尋找／拾獲分頁 → 自動跳一次
  useEffect(() => {
    if (!uid || !firstChecked || !seenOk || firstOpen || tour) return
    const name = TOUR_BY_PATH[pathname]
    if (name && !isSeen(`tour_${name}`, uid)) setTour(name)
  }, [uid, firstChecked, seenOk, firstOpen, tour, pathname])

  const closeFirst = useCallback(() => {
    setFirstOpen(false)
    markOnboardingSeen(user)
    // 第一個使用教學結束後直接接上尋找使用教學（上面那個 effect 會在 firstOpen 變 false 後自動判斷；
    // 這裡明確寫出來，看過的人重看第一個使用教學時也會接上）
    if (TOUR_BY_PATH[pathname] === 'find') setTour('find')
  }, [user, pathname])

  const closeTour = useCallback(() => {
    if (tour) markSeen(`tour_${tour}`, uid)
    setTour(null)
  }, [tour, uid])

  if (firstOpen) return <OnboardingTour onClose={closeFirst} />
  if (tour) return <SpotlightTour key={tour} steps={TOURS[tour].steps} label={TOURS[tour].label} onClose={closeTour} />
  return null
}
