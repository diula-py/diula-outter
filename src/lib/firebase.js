import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  clearIndexedDbPersistence,
} from 'firebase/firestore'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFunctions } from 'firebase/functions'

// 照搬 diula-inner index.html 現有設定，兩邊指向同一個 Firebase 專案。
const firebaseConfig = {
  apiKey: 'AIzaSyC7w693GmLxWh7EFHpdIzcgvmPdkRVpq10',
  authDomain: 'diula--test.firebaseapp.com',
  projectId: 'diula--test',
  storageBucket: 'diula--test.firebasestorage.app',
  messagingSenderId: '30709340302',
  appId: '1:30709340302:web:0e6cd003a8e3d9a9c251df',
  measurementId: 'G-XK544H72PS',
}

export const app = initializeApp(firebaseConfig)
// Firestore 離線快取（存在 IndexedDB）：看過的 lost_items / found_items 離線也讀得到，
// getDocs / getDoc 離線時會自動改讀快取。multipleTab：同時開多個分頁也能共用快取。
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
export const auth = getAuth(app)
export const functions = getFunctions(app, 'asia-east1')

// 強制 browserLocalPersistence，PWA storage 受限時的處理照搬舊版。
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Firebase Persistence Error:', error)
})

// 登出時清掉這台裝置上的使用者資料：展覽共用手機時，下一個人不會看到上一個人的
// 遺失物／拾獲物（離線快取裡可能有證件照）。
// Firestore 快取要先 terminate 才能清；terminate 之後 db 不能再用，所以呼叫完一定要重新載入頁面。
export async function clearLocalUserData() {
  try { await terminate(db) } catch { /* 已經關了 */ }
  try {
    await clearIndexedDbPersistence(db)
  } catch (e) {
    // 另一個分頁還開著同一個 App 時會清不掉（failed-precondition）；不擋登出
    console.warn('清除 Firestore 離線快取失敗：', e)
  }
  try {
    sessionStorage.removeItem('diula_handled_lost_ids') // 發文／推播擇一的紀錄
    localStorage.removeItem('diula_my_items')           // 舊版本機「我的遺失物」紀錄
  } catch { /* 無痕模式等存取不到就算了 */ }
}
