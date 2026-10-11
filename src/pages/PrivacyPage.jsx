import { LegalPage, Article, Items, Bullets, Para, InfoCards } from '../components/LegalKit'

// 政策內容改版時，記得一起改 lib/termsConsent.js 的 TERMS_VERSION，Firestore 的同意紀錄才分得出是哪一版。
const DATA_COLUMNS = ['資料項目', '內容', '取得方式', '用途']
const DATA_ROWS = [
  ['帳號資料', 'LINE 或 Google 使用者識別碼、顯示名稱、大頭貼、電子郵件地址、帳號建立與最後登入時間、同意條款時間', '使用者以第三方帳號登入時授權取得', '身分驗證、帳號管理'],
  ['通知資料', '電子郵件地址、LINE 使用者識別碼', '登入或加入 LINE 官方帳號時取得', '透過 Gmail 或 LINE 傳送比對結果與狀態通知'],
  ['物品資訊', '物品照片、AI 標籤、遺失或拾獲時間、地點（縣市及鄉鎮區）、文字描述、物品狀態、刊登時間', '使用者自行上傳或填寫', '登錄、查詢、自動比對、Threads 協尋發文'],
  ['證件類拾獲物照片', '證件影像，其上個人資料經打碼處理', '拾獲者上傳', '協助失主辨識與尋回'],
  ['使用紀錄', 'IP 位址、瀏覽器與裝置資訊（User-Agent）、存取時間；操作紀錄僅限「使用 AI 辨識」之請求紀錄', '雲端平台（Google Firebase、Render、GitHub）自動記錄', '系統維護、資訊安全、除錯'],
]

const SERVICE_COLUMNS = ['服務', '用途', '處理的資料']
const SERVICE_ROWS = [
  ['Google 登入', '第三方帳號登入', '帳號資料'],
  ['Google Firebase', '資料庫、檔案儲存與身分驗證', '帳號資料、物品資訊與照片'],
  ['Google Gemini API', 'AI 照片辨識與自動標籤', '物品照片與描述'],
  ['Gmail', '寄送通知信', '電子郵件地址、通知內容'],
  ['LINE Login／LIFF', '帳號登入、於 LINE 內開啟本平台', '帳號資料'],
  ['LINE Messaging API', '官方帳號通知', 'LINE 使用者識別碼、通知內容'],
  ['Meta Threads', '協尋發文與刪文、關鍵字搜尋', '物品資訊（不含姓名與聯絡方式）、搜尋關鍵字'],
  ['Google Cloud Functions', '執行 AI 辨識請求', '物品照片、請求紀錄（IP 位址、User-Agent、請求時間）'],
  ['Render', '後端伺服器（Flask、Spring Boot、AI 服務）', '請求內容、IP 位址、裝置資訊與時間'],
  ['GitHub Pages', '網站託管', '訪客 IP 位址與造訪時間'],
]

function Label({ children }) {
  return <strong className="font-medium text-brown">{children}：</strong>
}

export default function PrivacyPage() {
  return (
    <LegalPage title="隱私權政策" updatedAt="2026 年 10 月 12 日">
      <Article title="第一條　前言與適用範圍">
        <Para>
          世新大學資訊傳播學系 112 級畢業製作團隊「探險活寶」（以下簡稱「本團隊」）開發營運 DiuLa! 遺失物協尋平台（以下簡稱「本平台」），並依個人資料保護法（以下簡稱「個資法」）第 8 條規定，以本政策告知使用者本平台如何蒐集、處理、利用及保護個人資料。
        </Para>
        <Para>
          本政策適用於本平台網站、漸進式網頁應用程式（PWA）、LINE 官方帳號及 LINE 應用介面（LIFF）。使用者經由本平台連結前往之第三方網站或服務（如 Threads、內政部警政署或臺北捷運網站），適用各該網站之隱私權政策。
        </Para>
        <Para>本政策為〈DiuLa! 使用者服務條款〉之一部分。使用者登入本平台，即表示已閱讀並同意本政策。</Para>
      </Article>

      <Article title="第二條　蒐集目的">
        <Para>本團隊蒐集使用者個人資料，僅用於下列目的：</Para>
        <Items>
          <li>提供遺失物登錄、拾獲物登錄、跨平台整合查詢與 Threads 關鍵字搜尋。</li>
          <li>以 AI 辨識照片並產生物品標籤，及以系統自動比對遺失物與拾獲物。</li>
          <li>透過 Gmail 或 LINE 官方帳號通知比對結果與物品狀態。</li>
          <li>經使用者選擇後，於 Threads 發布及刪除協尋貼文。</li>
          <li>帳號身分驗證、系統維護、資訊安全與防止濫用。</li>
          <li>以去識別化之統計資料進行畢業製作之研究分析與成果展示。</li>
        </Items>
        <Para>
          上述目的對應個資法之特定目的：〇六九 契約、類似契約或其他法律關係事務；〇九〇 消費者、客戶管理與服務；一三五 資（通）訊服務；一三六 資（通）訊與資料庫管理；一五七 調查、統計與研究分析。
        </Para>
      </Article>

      <Article title="第三條　蒐集之個人資料類別">
        <Para>本平台蒐集之個人資料如下表，均限於提供服務所必要之範圍。</Para>
        <InfoCards columns={DATA_COLUMNS} rows={DATA_ROWS} />
        <Para>
          為維護系統安全與排除錯誤，本平台使用之雲端平台（Google Firebase、Render、GitHub）會自動記錄連線之 IP 位址、瀏覽器類型及存取時間，保留期間依各平台設定（約 30 天）。本平台不會將上述資料用於識別個人或行銷目的。
        </Para>
        <Para>
          本平台不要求使用者提供身分證字號、金融帳戶、信用卡號等資料，請勿於任何欄位填寫。證件類拾獲物照片所含為失主之個人資料，本團隊僅於協助其尋回之必要範圍內處理。
        </Para>
      </Article>

      <Article title="第四條　個人資料之利用期間、地區、對象及方式">
        <Para>
          <Label>期間</Label>
          自使用者登入本平台起，至帳號刪除或本平台終止服務時止。物品標示為「已找到」或刪除登錄後，相關資料將於 30 天內刪除或去識別化。本平台為畢業製作作品，服務終止時將公告，並刪除或去識別化全部使用者資料；法令另有保存規定或為處理爭議所必要者，不在此限。
        </Para>
        <Para>
          <Label>地區</Label>
          中華民國境內，及第三方服務提供者之伺服器所在地區。Google、LINE、Meta 等服務之伺服器可能位於境外，使用者同意資料因此傳輸至境外處理。
        </Para>
        <Para>
          <Label>對象</Label>
        </Para>
        <Items>
          <li>本團隊成員，僅於開發、維護與處理使用者請求之必要範圍內存取。</li>
          <li>第五條所列之第三方服務提供者。</li>
          <li>其他使用者：僅限第六條所列之公開資訊。</li>
          <li>依法令規定或經司法、行政機關依法要求者。</li>
        </Items>
        <Para>
          <Label>方式</Label>
          以電子方式自動化處理，包括資料庫儲存、AI 圖片辨識、系統自動比對、Gmail 與 LINE 通知、Threads 發文及刪文。本團隊不會將使用者個人資料出售、出租或提供予與本平台服務無關之第三人。
        </Para>
      </Article>

      <Article title="第五條　第三方服務">
        <Para>為提供服務，本平台使用下列第三方服務處理部分資料。各服務依其自身之隱私權政策處理資料，本團隊僅提供完成該用途所必要之資料。</Para>
        <InfoCards columns={SERVICE_COLUMNS} rows={SERVICE_ROWS} />
      </Article>

      <Article title="第六條　公開資訊與他人可見範圍">
        <Bullets>
          <li>為協助尋回物品，使用者登錄之物品照片、標籤、時間、地點、描述及物品狀態，將供其他使用者查詢與比對。</li>
          <li>本平台不公開顯示使用者之電子郵件地址與 LINE 使用者識別碼。</li>
          <li>使用者選擇之 Threads 協尋貼文公開於 Threads 平台，任何人皆可瀏覽、轉發。本平台刪除貼文後，已被他人轉發、截圖或引用之內容無法收回。</li>
          <li>請勿於物品照片或描述中包含人臉、住址、電話等可識別個人之資訊。</li>
        </Bullets>
      </Article>

      <Article title="第七條　資料安全">
        <Bullets>
          <li>本平台以 HTTPS 加密傳輸資料。</li>
          <li>本平台以身分驗證與資料庫存取規則限制權限，僅使用者本人得修改或刪除其登錄之資料。</li>
          <li>證件類拾獲物照片於上傳時進行個資打碼。</li>
          <li>後台資料僅本團隊必要成員可存取。</li>
          <li>如個人資料被竊取、竄改、毀損、滅失或洩漏，本團隊將依個資法第 12 條通知受影響之使用者，並立即採取應變措施，防止損害擴大。</li>
          <li>網路傳輸無法保證絕對安全，使用者亦應妥善保管其 LINE 或 Google 帳號。</li>
          <li>使用者如發現本平台有資安漏洞，請來信至 diula.112ics@gmail.com 通報，並請勿自行測試、利用或公開該漏洞；本團隊將儘速確認並修補。</li>
        </Bullets>
      </Article>

      <Article title="第八條　瀏覽器本機儲存">
        <Bullets>
          <li>本平台使用瀏覽器本機儲存（包括 localStorage、IndexedDB 及 Service Worker 快取），保存登入狀態、條款同意紀錄、介面偏好，以及供離線瀏覽使用之資料快取。PWA 離線上傳功能預計於 2026 年 12 月 4 日前上線，上線後將以本機儲存暫存離線時之上傳內容，待網路恢復後自動上傳。</li>
          <li>本平台不使用第三方廣告追蹤 Cookie。</li>
          <li>使用者得於瀏覽器設定中清除本平台之網站資料，但可能因此無法維持登入或使用部分功能。</li>
        </Bullets>
      </Article>

      <Article title="第九條　使用者之權利與行使方式">
        <Para>依個資法第 3 條，使用者就其個人資料得行使下列權利：</Para>
        <Items>
          <li>查詢或請求閱覽。</li>
          <li>請求製給複製本。</li>
          <li>請求補充或更正。</li>
          <li>請求停止蒐集、處理或利用。</li>
          <li>請求刪除。</li>
        </Items>
        <Para>
          物品登錄資料，使用者得於「我的遺失物」、「我的拾獲物」頁面自行編輯或刪除。其他請求，請來信至 diula.112ics@gmail.com，註明登入方式（LINE 或 Google）、顯示名稱及請求事項；本團隊確認為本人後辦理。
        </Para>
        <Para>
          依個資法第 13 條，查詢、閱覽或製給複製本之請求，本團隊於 15 日內決定，必要時得延長 15 日；補充、更正、停止或刪除之請求，於 30 日內決定，必要時得延長 30 日。延長時，將以書面告知理由。
        </Para>
      </Article>

      <Article title="第十條　不提供個人資料之影響">
        <Para>使用者得自由選擇是否提供個人資料，但可能影響使用：</Para>
        <Bullets>
          <li>本平台須登入方得使用；不同意提供帳號資料者，將無法使用本平台。</li>
          <li>未提供物品照片或描述，可能影響 AI 辨識與自動比對之結果。</li>
          <li>不同意接收通知者，將無法即時得知比對結果。</li>
        </Bullets>
      </Article>

      <Article title="第十一條　未成年人">
        <Para>未滿十八歲之使用者，應經法定代理人閱讀並同意本政策後，方得使用本平台。法定代理人得代為行使第九條之權利。</Para>
      </Article>

      <Article title="第十二條　政策修訂">
        <Para>本團隊得修訂本政策，修訂後於本平台公告。修訂涉及蒐集目的、資料類別或第三方服務之重大變更時，將以平台公告、Gmail 或 LINE 官方帳號通知使用者。</Para>
      </Article>

      <Article title="第十三條　聯絡方式">
        <Para>對本政策有任何疑問，或欲行使第九條之權利，請來信至：diula.112ics@gmail.com。</Para>
      </Article>
    </LegalPage>
  )
}
