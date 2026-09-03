# DiuLa 前端整合對齊文件（INTEGRATION.md）

> 兩位技術（React 前端 `diula-app` × 另一位技術組員的實作）整合前要**先對齊的契約與設計**。
> 這份是「單一真相來源」：任何一方改動下列項目，請同步更新這份並通知對方。

---

## 0. 先決定：整合模式

| 模式 | 說明 | 影響 |
|---|---|---|
| **A. 合併成一個 codebase** | 兩人的頁面併進同一個 app（React 或 vanilla 擇一） | 技術棧要統一、其中一方元件需重寫 |
| **B. 兩個 app、用網址互跳**（建議） | 各自部署，流程間用連結交接 | 技術棧可不同，但**資料契約＋設計必須一致**，跨網域要設 CORS |

- 現況：本專案是 **React（Vite + Tailwind）**；組員參考碼是 **vanilla HTML/CSS/JS**。
- 建議走 **B**（各自維護、風險低），除非要收斂成單一 repo。
- 無論 A/B，**第 1、2 節的契約都必須對齊**。

---

## 1. 必須統一的資料契約（不一致會直接壞掉）

### 1.1 標籤分類表（taxonomy）
- 兩邊分類名、標籤字串、順序要**逐字一致**。
- 現況：本專案 `src/data/tagTaxonomy.js` 與組員 `PREDEFINED_TAXONOMY` **幾乎完全相同**（「顏色」16 色排最前，其餘分類皆對得上）。
- 待辦：抽成**單一共用來源**（一方改、另一方跟），避免各自維護分岔。

顏色 16 色（務必一致）：
`黑色 白色 灰色 紅色 橙色 黃色 綠色 藍色 紫色 粉色 棕色 米色 金色 銀色 透明 彩色`

### 1.2 API 欄位格式（送出的 JSON 欄位名要一模一樣）

| 端點 | 後端 | 送出欄位 | 回傳 |
|---|---|---|---|
| `/analyze-item` | Render AI `diula-backend-api` | `text`, `base64Image` | `{ items: [{ main_category, sub_tag, colors }] }` |
| `/match` | Flask `diula` | `lost_date`, `tags`, `detail` | 比對結果陣列 |
| `/threads/submit` | Flask `diula` | `text`, `image`, `name`, `lost_date`, `location` | `{ post_id, permalink }` |
| `/threads/delete` | Flask `diula` | `post_id` | `{ ok, ... }` |
| `/subscriptions` | Flask `diula` | `channel`(line/email), `criteria`(含 `category_id`,`lost_date`)… | 訂閱結果 |
| `/api/id-cards` | Spring Boot `diula-api` | `docType`, `maskRegionCount`, `manual`, `date`, `location`, `dropLocation`, `remark`, `image` | `{ id }` |
| `/api/posts` `/api/image` | Spring Boot `diula-api` | — (GET) | Threads 社群貼文 / 圖片代理 |

### 1.3 docType 列舉（只有 4 種）
`national_id` / `health_card` / `student_id` / `other`
- 細類型（護照、存摺…）**不改 docType**，記在 `name` / `tags` 供顯示。

### 1.4 地點字串格式
- 一律 `"縣市 地區"`，中間**一個半形空格**。例：`台北市 中正區`。
- 縣市/地區清單以台灣 22 縣市行政區為準（本專案 `src/data/taiwanRegions.js`）。

### 1.5 圖片處理共識（踩過的坑，兩邊都要做）
- 後端請求上限約 **2MB**，超過回 **413**（瀏覽器常顯示 `Load failed`）。
- Threads 抓大圖會逾時（錯誤碼 2207003）。
- → **上傳前一律縮圖**：證件 ≤ **1600px**、Threads ≤ **1280px**，JPEG q0.82~0.85。
- 建議把縮圖函式抽成兩邊共用同一份，參數一致。

### 1.6 localStorage schema（若兩邊都讀「我的遺失/拾獲物」）
- key：`diula_my_items`
- item 欄位：`{ id, kind, code, name, date, place, tags, image, dropLocation?, remark?, status?, thread_post_id?, thread_post_url?, created_at }`
- `kind`：`found`（拾獲）/ `threads`（協尋發文）/ `lost`（一般遺失）
- 若只有一方擁有此資料就不需對齊。

---

## 2. 設計系統（UI 一致）

### 2.1 色票
| 用途 | Hex | Tailwind token |
|---|---|---|
| 品牌主色（標題/按鈕文字） | `#492c13` ⚠️ 見下 | `brown` |
| App 背景 / 未選中 tab | `#ffffff` | `base` |
| 米色大卡片 | `#f3f0e1` | `card` |
| 輸入框 / 次要按鈕 | `#f5f5f5` | `input` |
| banner / TabBar / 選中態 | `#dfeaf5` | `blue` |
| 刪除 / 警告 | `#c72f02` | `error` |
| 表單 icon（日曆/地點/箭頭） | `#1e3050` | `navy` |
| placeholder / 未選取文字 | `#b5a692` | `hint` |

### 2.2 字型
- 中文：**源泉圓體**（自架 woff2，family 名 `"GenSenRounded TW"`，R/M/B 三字重）。
- `font-display: swap`；因中文字型大（每字重約 6MB），首次載入會先顯示 fallback。
- ⚠️ family 名稱兩邊要一致，並確保都載**同一份 webfont**，否則會 fallback 成系統字。

### 2.3 圖示
- 一律用 **FontAwesome**（本專案表單/導覽圖示已用官方 FA 形狀，顏色 `navy`）。
- 圖示顏色要能隨場合換（表單 navy、標題/按鈕 brown）→ 用 SVG `currentColor`，避免寫死顏色的 PNG。

### 2.4 元件樣式基準
- 膠囊按鈕 / 標籤圓角：`border-radius: 50px`，`1px` 黑框。
- 卡片圓角：`10px`。
- 標籤選取：**未選白底、已選藍底**（不要用粗外框環）。
- 「已選標籤」的 ✓ 確認鈕：未選任何標籤時**灰色停用**，選了才可按。

---

## 3. 目前發現的具體不一致（整合前要對齊 / 修掉）

| 項目 | 本專案 | 組員參考 | 建議 |
|---|---|---|---|
| **品牌咖啡色** | `#492c13` | `#482B12` | ⚠️ **不同**，以設計稿為準二選一，兩邊統一 |
| **字型 family** | `"GenSenRounded TW"` | `Comfortaa, GenSenRounded2 TW, Chiron GoRound TC` | 統一 family 名稱＋載同一份 webfont |
| **「身分證」用字** | 分頁/DOCTYPE key 用「身**份**證」、taxonomy/打碼用「身**分**證」 | 「身分證」 | 官方為「身**分**證」，全部統一（本專案內部先自清） |
| **「便當盒」重複** | 同時在「日常用品」與「其他」 | 只在一處 | 移除「其他」內的重複 |

---

## 4. 整合機制建議

1. **共用契約單一真相**：taxonomy、色票、API 欄位抽成共用檔/常數，一方改、另一方跟。
2. **CORS / 網域**（B 模式）：所有後端目前只放行 `https://diula-py.github.io`。
   - 組員若部署在別網址，需在下列各處加上他的 origin：
     - Flask `ALLOWED_ORIGINS`（`diula` 服務）
     - Spring Boot `@CrossOrigin`（`diula-api`，尤其 `/api/id-cards`）
     - Render AI 服務
   - （前例：網址從 saamiin 換 diula-py 沒同步 CORS，導致證件登錄整個壞掉。）
3. **路由**：GitHub Pages 用 HashRouter（`#/...`）。互跳的入口/出口網址寫死成常數、講好。
4. **頁面分工**：哪些頁誰負責先講清楚，避免重工與風格分岔；交接頁先對齊 header／色／字型。
5. **後端時序**：Threads 發文改「輪詢容器狀態」而非固定 sleep（避免整個請求 ~30 秒讓手機逾時）。

---

## 5. 整合前 Checklist

- [ ] 決定整合模式 A / B
- [ ] taxonomy 抽成單一共用來源，逐字對齊（含 16 色）
- [ ] 統一咖啡色 hex（`#492c13` vs `#482B12`）
- [ ] 統一字型 family 名稱＋兩邊載同一份 webfont
- [ ] 修「身份證 → 身分證」用字；移除重複「便當盒」
- [ ] 對齊 API 端點欄位名（尤其 `/match`、`/api/id-cards`）
- [ ] docType 4 個列舉值對齊
- [ ] 地點字串 `"縣市 地區"` 格式對齊
- [ ] 兩邊都做上傳縮圖（≤1600 / ≤1280）
- [ ] 後端 CORS 加上雙方網址
- [ ] 講好頁面分工與互跳網址

---

## 6. 兩實作差異與收斂計畫

> 看過組員完整檔案（vanilla 單檔 SPA）後的實況：**這不是「兩人各做一半」，而是「兩份幾乎完整、但架構不同的同一個 App」**。兩邊都做了登入→找失物→AI 標籤→比對→登錄拾獲→我的清單→Threads。整合是「調解兩套競品並收斂成一份」，不是拼接。

### 6.1 架構差異對照

| 面向 | 組員（vanilla 單檔） | 本專案（React） | 衝突 |
|---|---|---|---|
| 登入 / 身分 | LINE LIFF + Google，產 `user_id`（`generateUserId`） | **無登入**（個人頁為假資料） | 🔴 |
| 「我的物品」存哪 | Firestore `lost_items`/`found_items`，用 `user_id` 綁定 | **localStorage**（`diula_my_items`） | 🔴 |
| 比對 | 前端讀 Firestore `found_items`(status=保管中) 做標籤重疊計數（`loadMatchResults`），只比 DiuLa 自家 | Flask `/match`（警政署/北捷/高鐵/DiuLa 四來源、加權計分） | 🔴 |
| 證件打碼 | **無打碼**，證件原圖 base64 直存 `found_items`（含 `idType`） | 打碼後才上傳，走 Spring `/api/id-cards`→`diula_id_card` | 🔴 隱私 |
| Threads 發文 | Firestore 標記 `threadsPostScheduled:true`（後端排程發） | 直接打 Flask `/threads/submit` 即時發、回 permalink | 🟠 |
| AI 辨識 | 同一支 `analyze-item`，把 `sub_tag`+`colors` 塞進標籤 | 相同 | 🟢 |
| 圖片壓縮 | `compressImage` 800px/q0.7，base64 存進 Firestore doc | 縮 1600/1280，走後端 | 🟠 |
| taxonomy / 地點 | `PREDEFINED_TAXONOMY` / `twLocations` | 幾乎逐字相同 | 🟢 |

共通點：AI 端點、taxonomy、地點清單、色票/字型基本一致，Firebase 都指向 `diula--test`。分歧集中在**帳號、資料儲存、比對、證件**四條主幹。

### 6.2 必須調解的事項

1. **帳號與 user_id**：React 目前無登入。整合須採用組員的 LIFF + Google + `generateUserId` 同一套，否則兩邊「我的物品」對不到同一人。
2. **我的物品的真實來源**：**選 Firestore**（localStorage 不能跨裝置/登入同步）。React 從 localStorage 改讀寫 `lost_items`/`found_items`，欄位對齊（`image_base64`/`notes`/`user_id`/`status`…）。
3. **比對引擎**：建議統一走 Flask `/match`（四來源、加權），組員前端標籤計數退場。
4. **證件流程（隱私）**：⚠️ 組員版把**未打碼證件原圖**存進 Firestore。整合一律用**打碼流程**，證件走 `diula_id_card`，不存原圖。
5. **Threads 發文**：即時發（Flask）或排程旗標（Firestore）擇一。
6. **欄位/collection 命名**：`notes`↔`remark`、`image_base64`↔`image`、證件放 `found_items`(idType) ↔ `diula_id_card`(docType)。統一，否則比對引擎 adapter 讀錯。
7. **Firestore 單筆 1MB 上限**：base64 圖存進 doc，800px 有機會破 1MB 導致寫入失敗 → 改存 Storage 或再壓。

### 6.3 收斂辦法（建議）

兩份重疊的完整 App → **收斂成一份 codebase、按功能決定誰的實作勝出**（並存互跳會因帳號/資料雙寫長期打架）。

「勝出」組合（各取所長）：

| 功能 | 採用 | 理由 |
|---|---|---|
| 登入 / user_id / Firestore 資料層 | 組員 | React 這塊是空的 |
| UI / 字型 / 圖示 / 標籤彈窗 | React | 較完整、已對齊設計 |
| 證件打碼 | React | 隱私必要 |
| 四來源比對 | Flask `/match` | 最完整 |
| Threads 即時發 | React（Flask 流程） | 有 permalink、已驗證 |

**落地路徑（二選一，待拍板）**：
- **路徑 A（建議）**：以 React 為主體，移植組員的「LIFF/Google 登入 + Firestore 資料層」，localStorage 全換 Firestore，比對改打 Flask。工集中在「補登入 + 換資料層」。
- **路徑 B**：以組員 vanilla 為主體，補進「打碼、即時 Threads、Flask 比對、字型/圖示」。需重寫整個 UI 層。

### 6.4 路徑 A 待辦（若採 A）

- [ ] 移植 LIFF init（`liffId 2009840543-oj99U5pA`）+ Google 登入到 React，建立登入頁/個人頁真資料
- [ ] 建立 `user_id` 產生器（對齊組員 `generateUserId` 規則，`L/G + yymm + hash`）
- [ ] 新增 Firestore 資料層（`lost_items`/`found_items` 讀寫、`where user_id ==`），移除 localStorage（`myItems.js`）
- [ ] 欄位對齊：`image_base64`、`notes`、`status`(尋找中/保管中/已找到/自動推播中…)、`timestamp`
- [ ] 我的遺失/拾獲清單、詳情、刪除改讀 Firestore
- [ ] 跨平台比對改打 Flask `/match`（保留四來源 tabs）
- [ ] 證件流程確認走打碼 + `diula_id_card`（不進 `found_items`）
- [ ] 統一色 `#492c13`/字型 family、修「身分證」用字、移除重複「便當盒」

---

## 附錄：後端服務對照

| 服務 | 平台 | 網址 | 負責 |
|---|---|---|---|
| Spring Boot | Render `diula-api` | `https://diula-api.onrender.com` | 主站頁面 + `/api/*`（id-cards、posts、image） |
| Flask | Render `diula` | `https://diula.onrender.com` | `/match`、`/categories`、`/threads/*`、`/subscriptions/*` |
| Render AI | Render | `https://diula-backend-api.onrender.com/api` | `/analyze-item`（AI 產標籤/顏色） |
| 前端（本專案） | GitHub Pages | `https://diula-py.github.io/diula-outter/` | React app |

> Render 免費方案閒置 15 分鐘休眠，冷啟動要等；Demo 前先各開一次叫醒。
