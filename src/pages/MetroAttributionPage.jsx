import { LegalPage, Items } from '../components/LegalKit'

// 臺北捷運遺失物開放資料的顯名聲明（政府資料開放授權條款要求標示出處）。
// 內容同使用者服務條款第十條第 3 項；比對結果頁「北捷」分頁底部的連結會連過來。
export default function MetroAttributionPage() {
  return (
    <LegalPage title="北捷遺失物資料來源">
      <Items>
        <li>臺北大眾捷運股份有限公司 2026 臺北捷運 API 服務「遺失物資訊」</li>
        <li>此開放資料依政府資料開放授權條款 (Open Government Data License) 進行公眾釋出，使用者於遵守本條款各項規定之前提下，得利用之。</li>
        <li>
          政府資料開放授權條款：
          <a href="https://data.gov.tw/license" target="_blank" rel="noopener noreferrer" className="break-words text-brown underline">
            https://data.gov.tw/license
          </a>
        </li>
      </Items>
    </LegalPage>
  )
}
