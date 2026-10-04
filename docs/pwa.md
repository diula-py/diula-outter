# PWA / 離線功能說明

設定在 `vite.config.js` 的 `VitePWA(...)`，註冊在 `src/main.jsx`。

## 離線時可以做什麼

| 內容 | 怎麼存 | 離線時 |
|---|---|---|
| 網頁外殼（HTML / JS / CSS / 圖示） | SW precache，每次部署自動換新 | 打得開 |
| 我的遺失物 / 拾獲物（含圖片） | Firestore 離線快取（IndexedDB） | 看得到「連線時看過的」 |
| Threads 貼文清單 | SW `NetworkFirst`，只留最新一份 | 看得到最後一次連線抓到的；縮圖不快取，顯示空白方塊 |
| 源泉圓體 / Comfortaa 字型 | SW `CacheFirst`（第一次載入後才存，不放 precache） | 沒載過就用系統字型 |
| LINE 登入狀態 | localStorage `diula_last_line_user` | 用上次的 LINE 身分，只讀快取 |

**不會**被 SW 攔截或快取：Firestore、Firebase Auth（`/__/auth/*`）、Google OAuth、LINE LIFF、
Render 上所有後端（Flask / Spring Boot / AI，含 `/api/posts`、`/api/image`），POST 一律不快取。

## 更新機制

`registerType: 'autoUpdate'` + `skipWaiting` + `clientsClaim`：部署新版後，裝置在下次開啟、
每小時、或切回分頁時檢查到新版，就會自動換上並重新整理一次頁面。

## 🚨 萬一 SW 出事：緊急停用

### 所有使用者（推薦）
1. `vite.config.js` 裡把 `// selfDestroying: true,` 的註解拿掉
2. push 到 main，等 GitHub Actions 部署完成
3. 每台裝置下次連線開啟網站時，SW 會自我移除並清掉快取，之後就跟沒有 PWA 一樣

確認問題修好後，再把 `selfDestroying` 加回註解、重新部署，SW 就會重新註冊。

### 單一裝置
- **電腦 Chrome**：DevTools → Application → Service Workers → Unregister；再到 Storage → Clear site data
- **iPhone / iPad**：設定 → Safari → 進階 → 網站資料 → 刪除 `diula-py.github.io`
  （加到主畫面的 PWA：直接刪掉主畫面圖示再重新加入）
- **Android Chrome**：網址列左邊的圖示 → 網站設定 → 清除資料
