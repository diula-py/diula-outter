import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

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
  // Firestore 規則要求 owner_uid == request.auth.uid 才讀寫得到這筆（見
  // firestore.rules，V-04b：原本任何登入者都能讀任何人的 user_registry）。
  // 直接讀 auth.currentUser 而不是讓呼叫端傳參數：這個函式有好幾個呼叫點，有的是
  // 在 custom token 還沒換完就先被呼叫（AuthContext 的逾時放行分支），用當下真正
  // 的 Firebase 身分最準，也不用每個呼叫點都記得傳對值。
  const ownerUid = auth.currentUser?.uid || null

  try {
    const registryRef = doc(db, 'user_registry', registryId)
    const snap = await getDoc(registryRef)
    if (snap.exists() && snap.data().user_id) {
      return snap.data().user_id
    }

    // 還沒登入到正式身分（custom token 還在背景換）：這裡不嘗試寫入，直接走下面
    // catch 區塊回傳臨時 user_id——寫了也會被規則擋下（owner_uid 對不上 request.auth.uid
    // 或 request.auth 本身是 null），等 token 換好後背景會再呼叫一次這個函式補上正確記錄
    // （見 AuthContext.jsx 的 resolveFromLine）。
    if (!ownerUid) throw new Error('尚未取得正式登入身分')

    const date = new Date()
    const yy = String(date.getFullYear()).slice(-2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const newUserId = `${loginProvider}${yy}${mm}${hash4}`

    await setDoc(registryRef, {
      user_id: newUserId,
      login_provider: loginProvider,
      yy,
      mm,
      owner_uid: ownerUid,
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
