import { asset } from './asset'

// 「尋找」選單資料：手機版「尋找」分頁（HomePage.jsx）用它當 items，
// 桌機版合併頁（HomeTabPage.jsx 的 lg: 區塊）也用同一份資料畫左邊卡片。
// tour：聚光燈導覽要框的按鈕（data-tour 值），見 lib/tabTours.jsx。
export const FIND_ITEMS = [
  { icon: asset('/icons/search.png'), label: '跨平台尋找遺失物', to: '/search', needsOnline: true, tour: 'find-cross' },
  { icon: asset('/icons/clock-rotate-left.png'), label: '近 2 日遺失物快速看', to: '/recent-found', tour: 'find-recent' },
  { icon: asset('/icons/threads.png'), label: 'Threads 尋找遺失物', to: '/search/threads', tour: 'find-threads' },
]

// 「拾獲」選單資料：手機版「拾獲」分頁（FoundHomePage.jsx）用它當 items，
// 桌機版合併頁（HomeTabPage.jsx 的 lg: 區塊）也用同一份資料畫右邊卡片。
export const REGISTER_ITEMS = [
  { icon: asset('/icons/address-card.png'), label: '證件類遺失物登錄', to: '/register/id', needsOnline: true, tour: 'found-id' },
  { icon: asset('/icons/clipboard-question.png'), label: '非證件類遺失物登錄', to: '/register/other', tour: 'found-other' },
]
