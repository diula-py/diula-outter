import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// 把原始 UID（LINE userId / Firebase uid）雜湊成固定 4 碼英數字，
// 同一個人永遠得到同樣的結果，不受時間影響——搬自 index.html 的 _hashUid()。
export function hashUid(originalUid) {
  let hashStr = originalUid
  if (originalUid && originalUid.length > 4) {
    let hash = 0
    for (let i = 0; i < originalUid.length; i++) {
      const char = originalUid.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    hashStr = Math.abs(hash).toString(36).toUpperCase().substring(0, 4)
  }
  return (hashStr || '').padStart(4, '0')
}

// 取得（或建立）某個使用者「永久不變」的 user_id。
// yy/mm 只在這個人第一次使用丟拉時決定一次，存進 user_registry，
// 之後不論哪個月份登入都直接讀回同一組 ID——搬自 index.html 的 getOrCreateUserId()，
// 修過「每次用當下年月重算導致舊資料查不到」的 bug 版本。
export async function getOrCreateUserId(loginProvider, originalUid) {
  const hash4 = hashUid(originalUid)
  const registryId = `${loginProvider}_${hash4}`

  try {
    const registryRef = doc(db, 'user_registry', registryId)
    const snap = await getDoc(registryRef)
    if (snap.exists() && snap.data().user_id) {
      return snap.data().user_id
    }

    const date = new Date()
    const yy = String(date.getFullYear()).slice(-2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const newUserId = `${loginProvider}${yy}${mm}${hash4}`

    await setDoc(registryRef, {
      user_id: newUserId,
      login_provider: loginProvider,
      yy,
      mm,
      created_at: serverTimestamp(),
    })
    return newUserId
  } catch (e) {
    console.error('讀取/建立 user_registry 失敗，改用臨時 user_id：', e)
    const date = new Date()
    const yy = String(date.getFullYear()).slice(-2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    return `${loginProvider}${yy}${mm}${hash4}`
  }
}
