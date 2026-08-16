import { Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import RegisterIdPage from './pages/RegisterIdPage'
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

export default function App() {
  return (
    <Routes>
      {/* 有底部 TabBar 的主頁面 */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/search/threads" element={<ThreadsSearchPage />} />
        <Route path="/search/threads/:id" element={<ThreadsPostDetail />} />
        <Route path="/search/results" element={<ResultsPage />} />
        <Route path="/search/results/:id" element={<ResultDetailPage />} />
        <Route path="/search/sos" element={<SosPostPage />} />
      </Route>

      {/* 首頁按鈕的目的地 —— 尚未做的先用 placeholder */}
      <Route path="/search" element={<CrossSearchPage />} />
      <Route path="/search/analyzing" element={<AiAnalyzingPage />} />
      <Route path="/search/confirm" element={<ConfirmTagsPage />} />
      <Route path="/search/subscribe" element={<SubscribePage />} />

      {/* 個人頁的目的地 —— 待做 */}
      <Route path="/my/lost" element={<MyLostPage />} />
      <Route path="/my/lost/:id" element={<MyLostDetailPage />} />
      <Route path="/my/found" element={<MyFoundPage />} />
      <Route path="/my/found/:id" element={<MyFoundDetailPage />} />
      <Route path="/about" element={<PlaceholderPage title="關於 DiuLa!" />} />
      <Route path="/register/id" element={<RegisterIdPage />} />
      <Route path="/register/other" element={<PlaceholderPage title="非證件類遺失物登錄" />} />
    </Routes>
  )
}
