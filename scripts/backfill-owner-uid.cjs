/**
 * 幫沒有正確 owner_uid 的舊物品／登入名冊補上主人（一次性，用 Admin SDK，不受規則限制）
 * =========================================================================
 * 背景：
 *   Firestore 規則改成「只有 owner_uid == request.auth.uid 才讀得到」之後，
 *   2026-10-04 之前建立的物品（沒有 owner_uid），以及 LINE 換 custom token 失敗、
 *   退回匿名登入時建立的物品（owner_uid 是匿名帳號），主人自己也看不到了。
 *   以前前端會在打開清單時自己「認領」，但那等於讓任何人把別人的舊資料認成自己的，已經拿掉。
 *
 *   2026-11-06 加了 user_registry（V-04b：原本任何登入者都能讀任何人的 user_registry，
 *   只要猜中 docId 格式固定、空間只有 2×36^4≈336 萬種），原因相同——這個 collection
 *   在改規則前從來沒有 owner_uid 欄位，全部都要靠這支補。
 *
 * 對應方式：
 *   lost_items / found_items：user_id 格式是 `${provider}${yy}${mm}${hash4}`，hash4 由原始
 *   uid 算出（src/lib/userId.js 的 hashUid）：
 *     - Google：原始 uid = Firebase uid，owner_uid 也是它
 *     - LINE：原始 uid = LINE userId，owner_uid = `line_${LINE userId}`
 *   把 Firebase Auth 裡所有正式帳號都算一次 provider + hash4，就能對回物品的 user_id。
 *
 *   user_registry：docId 本身就是 `${provider}_${hash4}`（例如 G_2IHF），比物品那兩個
 *   collection 簡單——不用從欄位內容反推，docId 直接就是 key，一個 key 本來就只該對到
 *   一個帳號（因為它本身就是帳號的雜湊），理論上不會撞號；真的撞號一樣跳過不猜。
 *
 *   三個 collection 共用同一套 provider+hash4 → Firebase uid 的對照表，同一個人的
 *   user_registry 和他的物品，backfill 後的 owner_uid 保證一致。
 *   LINE 使用者如果從來沒有成功換過 custom token，Auth 裡就沒有 line_xxx 帳號，也會對不到；
 *   等他之後登入過再跑一次即可。
 *
 * 用法（在 DiuLa-project 根目錄跑，firebase-admin 在根目錄的 node_modules）：
 *   node diula-outter/scripts/backfill-owner-uid.cjs                 # 只列出會改什麼（預設）
 *   node diula-outter/scripts/backfill-owner-uid.cjs --apply         # 真的寫入
 *   金鑰預設讀 ./serviceAccountKey.json，可用 --key <path> 指定。
 */
const path = require('path')
const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const keyIdx = args.indexOf('--key')
const keyPath = path.resolve(keyIdx >= 0 ? args[keyIdx + 1] : 'serviceAccountKey.json')

initializeApp({ credential: cert(require(keyPath)) })
const db = getFirestore()

const LINE_UID_PREFIX = 'line_'
const ITEM_COLLECTIONS = ['lost_items', 'found_items']
const REGISTRY_COLLECTION = 'user_registry'

// 與 src/lib/userId.js 的 hashUid 完全相同，改那邊要一起改。
function hashUid(originalUid) {
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

async function listRealUsers() {
  const users = []
  let pageToken
  do {
    const page = await getAuth().listUsers(1000, pageToken)
    users.push(...page.users)
    pageToken = page.pageToken
  } while (pageToken)
  return users
}

async function main() {
  // provider + hash4 → [owner uid]
  const byKey = new Map()
  const realUids = new Set()
  for (const u of await listRealUsers()) {
    let key
    if (u.uid.startsWith(LINE_UID_PREFIX)) key = 'L' + hashUid(u.uid.slice(LINE_UID_PREFIX.length))
    else if (u.providerData.some((p) => p.providerId === 'google.com')) key = 'G' + hashUid(u.uid)
    else continue // 匿名帳號
    realUids.add(u.uid)
    byKey.set(key, [...(byKey.get(key) || []), u.uid])
  }
  console.log(`正式帳號 ${realUids.size} 個`)

  for (const col of ITEM_COLLECTIONS) {
    const snap = await db.collection(col).get()
    const fixes = []
    const unmatched = []
    for (const d of snap.docs) {
      const { owner_uid: ownerUid, user_id: userId } = d.data()
      if (ownerUid && realUids.has(ownerUid)) continue
      const key = typeof userId === 'string' && userId.length >= 5 ? userId[0] + userId.slice(-4) : null
      const candidates = (key && byKey.get(key)) || []
      if (candidates.length === 1) fixes.push({ id: d.id, from: ownerUid || null, to: candidates[0] })
      else unmatched.push({ id: d.id, user_id: userId, reason: candidates.length ? '撞號' : '找不到帳號' })
    }

    console.log(`\n[${col}] 共 ${snap.size} 筆，要補 ${fixes.length} 筆，對不到 ${unmatched.length} 筆`)
    fixes.forEach((f) => console.log(`  ${f.id}: ${f.from ?? '(無)'} → ${f.to}`))
    unmatched.forEach((u) => console.log(`  ✗ ${u.id} (user_id=${u.user_id})：${u.reason}`))

    if (APPLY) {
      for (let i = 0; i < fixes.length; i += 400) {
        const batch = db.batch()
        fixes.slice(i, i + 400).forEach((f) => batch.update(db.collection(col).doc(f.id), { owner_uid: f.to }))
        await batch.commit()
      }
      console.log(`  已寫入 ${fixes.length} 筆`)
    }
  }
  // user_registry：docId 就是 key（例如 G_2IHF → 拿掉底線變 G2IHF，對照 byKey）。
  {
    const snap = await db.collection(REGISTRY_COLLECTION).get()
    const fixes = []
    const unmatched = []
    for (const d of snap.docs) {
      const { owner_uid: ownerUid } = d.data()
      if (ownerUid && realUids.has(ownerUid)) continue
      const key = d.id.replace('_', '')
      const candidates = byKey.get(key) || []
      if (candidates.length === 1) fixes.push({ id: d.id, from: ownerUid || null, to: candidates[0] })
      else unmatched.push({ id: d.id, reason: candidates.length ? '撞號' : '找不到帳號' })
    }

    console.log(`\n[${REGISTRY_COLLECTION}] 共 ${snap.size} 筆，要補 ${fixes.length} 筆，對不到 ${unmatched.length} 筆`)
    fixes.forEach((f) => console.log(`  ${f.id}: ${f.from ?? '(無)'} → ${f.to}`))
    unmatched.forEach((u) => console.log(`  ✗ ${u.id}：${u.reason}`))

    if (APPLY) {
      for (let i = 0; i < fixes.length; i += 400) {
        const batch = db.batch()
        fixes.slice(i, i + 400).forEach((f) =>
          batch.update(db.collection(REGISTRY_COLLECTION).doc(f.id), { owner_uid: f.to }))
        await batch.commit()
      }
      console.log(`  已寫入 ${fixes.length} 筆`)
    }
  }

  if (!APPLY) console.log('\n（只是預覽，加 --apply 才會寫入）')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
