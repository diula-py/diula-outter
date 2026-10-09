// 「我的遺失物 / 拾獲物」資料層：原本存 localStorage（diula_my_items），
// 現在改存 Firestore lost_items / found_items，對齊 diula-inner 現有的資料契約。
//
// kind 參數決定要讀寫哪個 collection：
//   'found' → found_items（登錄拾獲物）
//   其他（'lost' / 'threads' / 'subscription' …）→ lost_items（協尋相關的都算「我的遺失物」）
// 元件（頁面）本身沿用原本的欄位名（place / image / remark），
// 跟 Firestore 契約欄位名（location / image_base64 / notes）不同的地方，
// 由這個模組在讀寫邊界做轉換，不用改任何頁面元件。
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { LOST_STATUS, LEGACY_LOST_STATUS } from '../data/itemStatus'
import { displayTags } from '../data/tagTaxonomy'

function collectionFor(kind) {
  return kind === 'found' ? 'found_items' : 'lost_items'
}

// 照搬 index.html 的 generateItemId()。
export function generateItemId(type, isIdCategory) {
  const date = new Date()
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  let randomCode = ''
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (let i = 0; i < 3; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const cat = isIdCategory ? 'I' : 'N'
  return `DL-${type}${cat}-${yy}${mm}${dd}-${randomCode}`
}

// React 頁面欄位 -> Firestore 契約欄位（3.2 節）。
function toFirestoreFields({ place, image, remark, ...rest }) {
  const out = { ...rest }
  if (place !== undefined) out.location = place
  if (image !== undefined) out.image_base64 = image
  if (remark !== undefined) out.notes = remark
  return out
}

// Firestore 契約欄位 -> React 頁面欄位（反向轉換，讀出來給元件用）。
function fromFirestoreFields({ location, image_base64, notes, ...rest }) {
  return {
    ...rest,
    place: location,
    image: image_base64,
    remark: notes,
  }
}

function toPlainItem(id, kind, data) {
  const item = { id, ...fromFirestoreFields(data), kind: data.kind || kind }
  if (LEGACY_LOST_STATUS[item.status]) item.status = LEGACY_LOST_STATUS[item.status]
  // 以前 AI 吐的簡體標籤已經存進資料庫：資料庫不改，讀出來顯示時轉繁體
  if (Array.isArray(item.tags)) item.tags = displayTags(item.tags)
  return item
}

// 舊資料（2026-10-04 之前建立的）沒有 owner_uid，Firestore 規則認不出主人。
// 使用者自己開「我的遺失物／拾獲物」時順手把自己的那幾筆補上，補完規則就能鎖到人。
// 規則只允許「在 owner_uid 還不存在時、且只動這一個欄位」，所以這個動作改不壞別的資料。
// 失敗不擋畫面（例如被規則擋下或離線）——清單照樣顯示。
function claimUnowned(col, docs) {
  const uid = auth.currentUser?.uid
  if (!uid) return
  docs
    .filter((d) => !d.data().owner_uid)
    .forEach((d) => {
      updateDoc(doc(db, col, d.id), { owner_uid: uid }).catch(() => {})
    })
}

// 讀「我自己」的清單。kind='found' 讀 found_items，其餘讀 lost_items。
export async function listMyItems(kind, userId) {
  if (!userId) return []
  const col = collectionFor(kind)
  const q = query(collection(db, col), where('user_id', '==', userId))
  const snap = await getDocs(q)
  claimUnowned(col, snap.docs)
  const items = snap.docs.map((d) => toPlainItem(d.id, kind, d.data()))
  items.sort((a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0))
  return items
}

export async function getMyItem(kind, id) {
  const col = collectionFor(kind)
  const snap = await getDoc(doc(db, col, id))
  if (!snap.exists()) return null
  return toPlainItem(snap.id, kind, snap.data())
}

// 新增一筆。kind 決定 collection；data.kind（若有，例如 'threads'/'subscription'）
// 會照樣存進文件裡，供列表頁／詳情頁區分顯示用。
export async function addMyItem(kind, userId, data) {
  const { id: _ignoredId, created_at: _ignoredCreatedAt, ...rest } = data
  const tags = rest.tags || []
  const isIdCategory = tags.some((t) => t.includes('證件') || t.includes('卡'))
  const newId = generateItemId(kind === 'found' ? 'F' : 'L', isIdCategory)
  const col = collectionFor(kind)

  const payload = {
    ...toFirestoreFields(rest),
    kind: rest.kind || kind,
    user_id: userId,
    // Firestore 規則用這個欄位判斷「這筆是不是你的」。必須等於 request.auth.uid，
    // 否則 create 會被規則擋下（見 diula-outter/firestore.rules）。
    owner_uid: auth.currentUser?.uid ?? null,
    timestamp: serverTimestamp(),
  }
  if (kind === 'found') payload.picker_id = userId
  // 自動推播的開始時間，供 Cloud Function 判斷滿五天後結束推播
  if (rest.status === LOST_STATUS.BROADCASTING) payload.autoPushStartedAt = serverTimestamp()

  await setDoc(doc(db, col, newId), payload)
  return { id: newId, ...fromFirestoreFields(payload) }
}

export async function updateMyItem(kind, id, patch) {
  const col = collectionFor(kind)
  const fields = toFirestoreFields(patch)
  // 已建立的遺失物之後才開自動推播，一樣要記開始時間（同 addMyItem）
  if (patch.status === LOST_STATUS.BROADCASTING) fields.autoPushStartedAt = serverTimestamp()
  await updateDoc(doc(db, col, id), fields)
}

export async function removeMyItem(kind, id) {
  const col = collectionFor(kind)
  await deleteDoc(doc(db, col, id))
}
