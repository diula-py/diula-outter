import { Routes, Route, Outlet } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import RequireAuth from './components/RequireAuth'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import RegisterIdPage from './pages/RegisterIdPage'
import RegisterOtherPage from './pages/RegisterOtherPage'
import RegisterAnalyzingPage from './pages/RegisterAnalyzingPage'
import RegisterConfirmPage from './pages/RegisterConfirmPage'
import RegisterSuccessPage from './pages/RegisterSuccessPage'
import ThreadsSearchPage from './pages/ThreadsSearchPage'
import ThreadsPostDetail from './pages/ThreadsPostDetail'
import CrossSearchPage from './pages/CrossSearchPage'
import AiAnalyzingPage from './pages/AiAnalyzingPage'
import ConfirmTagsPage from './pages/ConfirmTagsPage'
import ResultsPage from './pages/ResultsPage'
import ResultDetailPage from './pages/ResultDetailPage'
import SosPostPage from './pages/SosPostPage'
import SubscribePage from './pages/SubscribePage'
import MyLostPage from './pages/MyLostPage'
import MyLostDetailPage from './pages/MyLostDetailPage'
import MyFoundPage from './pages/MyFoundPage'
import MyFoundDetailPage from './pages/MyFoundDetailPage'
import PlaceholderPage from './pages/PlaceholderPage'
import OfflineBanner from './components/OfflineBanner'
import StatusBarColor from './components/StatusBarColor'
import ScrollToTop from './components/ScrollToTop'

export default function App() {
  return (
    <>
      <StatusBarColor />
      <ScrollToTop />
      <OfflineBanner />
      <Routes>
        {/* 登入頁本身不能被擋，否則會變成無窮迴圈 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 2026-09-04 定案：一打開網頁就強制登入，未登入一律導去 /login，
            所以下面全部包在 RequireAuth 底下，不是只有寫入動作的地方才判斷。 */}
        <Route element={<RequireAuth><Outlet /></RequireAuth>}>
          {/* 有底部 TabBar 的主頁面 */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/search/threads" element={<ThreadsSearchPage />} />
            <Route path="/search/threads/:id" element={<ThreadsPostDetail />} />
            <Route path="/search/results/:id" element={<ResultDetailPage />} />
            <Route path="/search/sos" element={<SosPostPage />} />
          </Route>

          {/* 首頁按鈕的目的地 —— 尚未做的先用 placeholder */}
          <Route path="/search" element={<CrossSearchPage />} />
          <Route path="/search/analyzing" element={<AiAnalyzingPage />} />
          <Route path="/search/confirm" element={<ConfirmTagsPage />} />
          <Route path="/search/subscribe" element={<SubscribePage />} />
          {/* 比對結果頁不放底部 TabBar：容易誤觸離開，改用右上角「回首頁」＋確認彈窗 */}
          <Route path="/search/results" element={<ResultsPage />} />

          {/* 個人頁的目的地 —— 待做 */}
          <Route path="/my/lost" element={<MyLostPage />} />
          <Route path="/my/lost/:id" element={<MyLostDetailPage />} />
          <Route path="/my/found" element={<MyFoundPage />} />
          <Route path="/my/found/:id" element={<MyFoundDetailPage />} />
          <Route path="/about" element={<PlaceholderPage title="關於 DiuLa!" />} />
          <Route path="/register/id" element={<RegisterIdPage />} />
          <Route path="/register/analyzing" element={<RegisterAnalyzingPage />} />
          <Route path="/register/confirm" element={<RegisterConfirmPage />} />
          <Route path="/register/success" element={<RegisterSuccessPage />} />
          <Route path="/register/other" element={<RegisterOtherPage />} />
        </Route>
      </Routes>
    </>
  )
}
