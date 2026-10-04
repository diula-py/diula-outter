import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
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
