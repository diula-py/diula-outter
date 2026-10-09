// 遺失物標籤分類模板（新增標籤彈窗用）。
export const TAG_TAXONOMY = [
  { category: '顏色', tags: ['黑色', '白色', '灰色', '紅色', '橙色', '黃色', '綠色', '藍色', '紫色', '粉色', '棕色', '米色', '金色', '銀色', '透明', '彩色'] },
  { category: '現金', tags: ['台幣', '外幣'] },
  { category: '有價證券', tags: ['支票', '本票', '匯票', '股權證券', '債權證券', '認購（售）權證', '存托憑證', '國庫券', '債券'] },
  { category: '紙本票券', tags: ['車票', '演唱會門票', '統一發票'] },
  { category: '錢包與包袋', tags: ['皮夾/錢包', '卡夾', '卡套', '隨身包/背包', '行李箱/行李袋', '塑膠袋', '紙袋'] },
  { category: '證件', tags: ['身分證', '健保卡', '學生證', '護照', '存摺', '印章', '駕照', '行照', '居留證', '自然人憑證', '執照', '證書'] },
  { category: '實體卡', tags: ['悠遊卡/一卡通/icash', '信用卡/金融卡/簽帳卡', '儲值卡', '會員卡', '電話卡', '門禁卡'] },
  { category: '電子產品', tags: ['手機', '耳機', '智慧型手錶/手環', '筆記型電腦', '平板電腦', '相機', '滑鼠', '行動電源', '隨身碟', '記憶卡', '硬碟', '電池', '充電器/充電線', '隨身聽'] },
  { category: '衣物/佩戴物品', tags: ['上衣', '下著', '帽子', '鞋子', '襪子', '手套', '圍巾/絲巾', '眼鏡', '手錶', '首飾', '安全帽', '皮帶', '其他穿搭物品'] },
  { category: '鑰匙', tags: ['鑰匙', '遙控器'] },
  { category: '雨具', tags: ['折傘', '長傘', '雨衣'] },
  { category: '日常用品', tags: ['杯/瓶/壺類', '玩具', '玩偶', '便當盒'] },
  { category: '文件與文具', tags: ['文件袋', '文件', '書本', '雜誌', '記事本', '電話本', '文具'] },
  { category: '其他', tags: ['包裹', '紙箱', '食品', '寵物用品', '家電', '其他'] },
]

// 所有標籤攤平（查重用）
export const ALL_TAGS = TAG_TAXONOMY.flatMap((c) => c.tags)

const COLOR_TAGS = TAG_TAXONOMY.find((c) => c.category === '顏色').tags

// ── 簡體 → 繁體 ───────────────────────────────────────────
// AI（Gemini 輕量模型）偶爾不照 prompt 的繁體清單、吐出簡體（如「蓝色」），後端 /match 的資料也可能有。
// 只收標籤清單裡會用到的字；「折」不轉（「折傘」本來就是折），「存折」用整詞對照成「存摺」。
const S2T = {
  红: '紅', 黄: '黃', 绿: '綠', 蓝: '藍', 银: '銀', 币: '幣', 汇: '匯', 权: '權', 证: '證', 债: '債',
  认: '認', 购: '購', 凭: '憑', 国: '國', 库: '庫', 车: '車', 会: '會', 门: '門', 统: '統', 发: '發',
  夹: '夾', 钱: '錢', 随: '隨', 胶: '膠', 纸: '紙', 学: '學', 护: '護', 驾: '駕', 执: '執', 书: '書',
  游: '遊', 签: '簽', 账: '帳', 储: '儲', 员: '員', 电: '電', 话: '話', 机: '機', 表: '錶', 环: '環',
  笔: '筆', 记: '記', 脑: '腦', 动: '動', 忆: '憶', 线: '線', 听: '聽', 着: '著', 袜: '襪', 围: '圍',
  丝: '絲', 镜: '鏡', 饰: '飾', 带: '帶', 钥: '鑰', 遥: '遙', 伞: '傘', 长: '長', 壶: '壺', 类: '類',
  当: '當', 杂: '雜', 志: '誌', 宠: '寵', 颜: '顏',
}
const WORD_ALIASES = { 存折: '存摺' }

function toTraditional(tag) {
  return WORD_ALIASES[tag] || [...tag].map((ch) => S2T[ch] || ch).join('')
}

// AI 辨識結果進來時用：在清單裡就保留；簡體轉繁體後對得上也保留；都對不上就丟掉（封閉式歸類）。
export function cleanAiTags(tags = []) {
  const out = []
  for (const t of tags) {
    if (typeof t !== 'string' || !t) continue
    const tag = ALL_TAGS.includes(t) ? t : toTraditional(t)
    if (ALL_TAGS.includes(tag) && !out.includes(tag)) out.push(tag)
  }
  return out
}

// 顯示既有資料用（資料庫裡的舊標籤、後端回傳的標籤）：只轉繁體、不丟掉任何一個。
export function displayTags(tags = []) {
  return [...new Set(tags.filter((t) => typeof t === 'string' && t).map(toTraditional))]
}

// 「我的遺失物」標題：用使用者確認過的標籤組成，顏色在前、物品在後，中間不加分隔（例如「灰色滑鼠」）
export function titleFromTags(tags = []) {
  const colors = tags.filter((t) => COLOR_TAGS.includes(t))
  const others = tags.filter((t) => !COLOR_TAGS.includes(t))
  return [...colors, ...others].join('')
}
