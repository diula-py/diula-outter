import { Link } from 'react-router-dom'
import { asset } from '../lib/asset'

// 桌機版（lg:）頁尾，照 Figma 桌機設計稿。只在登入／尋找／拾獲／個人頁出現
// （跟 DesktopTopNav 一樣，手機版完全看不到）。
export default function DesktopFooter() {
  return (
    <footer className="mt-16 hidden w-full border-t border-card bg-[#F7F4E5] lg:flex lg:justify-center">
      <div className="flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-6 px-8 py-12">
        <img src={asset('/icons/diula-logo-cropped.png')} alt="DiuLa!" className="h-5 opacity-80" />
        <nav className="flex flex-wrap gap-6">
          <Link to="/privacy" className="text-sm font-medium text-brown opacity-80">隱私權政策</Link>
          <Link to="/terms" className="text-sm font-medium text-brown opacity-80">服務條款</Link>
          <a href="https://about.diula.co" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brown opacity-80">關於我們</a>
        </nav>
        <span className="text-sm font-medium text-brown">© 2026 DiuLa! 一站式遺失物AI協尋平台. All rights reserved.</span>
      </div>
    </footer>
  )
}
