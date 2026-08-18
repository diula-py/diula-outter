import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './fonts.css'
import './index.css'
import App from './App.jsx'

// GitHub Pages 沒有伺服器路由，重整/直連深層網址會 404 → 用 HashRouter（網址帶 #）。
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
