// 使用者服務條款與隱私權政策的同意紀錄：記在人身上，不記在裝置上。
// 按登入前還不知道是誰，所以每次按登入都要先同意（展覽共用手機時，每個人都會看到條款），
// 登入成功後再寫一筆到 Firestore terms_consents/{Firebase uid}，記下同意的版本 TERMS_VERSION。
// Google 登入是 popup，必須在點擊當下就叫出來（iPhone 會擋非同步開的視窗），
// 所以不能先寫 Firestore 再登入；改成按同意時先記一筆「待寫入」，登入完成後再補寫。
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { getOwnerUid } from './authToken'

export const TERMS_VERSION = '2026-10-12'

const PENDING_KEY = 'diula_terms_consent_pending'

// 按同意後多久內完成登入才算「這次同意的人」。展覽共用手機時，
// 按了同意卻沒登入（例如關掉 Google 視窗）的紀錄，不能記到下一個人頭上。
const PENDING_BIND_MS = 30 * 60 * 1000

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function writeJson(key, value) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 無痕模式等存不了：只是 Firestore 少一筆紀錄，不影響登入 */
  }
}

/** 使用者在彈窗按下「同意並登入」時呼叫（同步、不碰網路，不會耽誤 Google popup） */
export function markConsented() {
  writeJson(PENDING_KEY, { version: TERMS_VERSION, agreed_at: new Date().toISOString(), uid: null })
}

let syncing = false

/**
 * 登入完成後把待寫入的同意紀錄寫到 Firestore。user 為 AuthContext 的 user。
 * 第一次遇到登入的人就把待寫入紀錄綁給他；寫失敗留著，下次開 App 同一個人會再補寫。
 */
export async function syncConsentRecord(user) {
  if (!user || syncing) return
  const pending = readJson(PENDING_KEY)
  if (!pending) return

  if (!pending.uid) {
    if (Date.now() - Date.parse(pending.agreed_at) > PENDING_BIND_MS) {
      writeJson(PENDING_KEY, null)
      return
    }
    pending.uid = user.uid
    writeJson(PENDING_KEY, pending)
  }
  if (pending.uid !== user.uid) return

  syncing = true
  try {
    const ownerUid = await getOwnerUid()
    await setDoc(doc(db, 'terms_consents', ownerUid), {
      terms_version: pending.version,
      agreed_at_client: pending.agreed_at,
      accepted_at: serverTimestamp(),
      provider: user.provider,
      user_id: user.userId,
    })
    writeJson(PENDING_KEY, null)
  } catch (e) {
    console.warn('寫入條款同意紀錄失敗，下次再補寫：', e)
  } finally {
    syncing = false
  }
}
