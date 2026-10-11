import { LegalPage, Para } from '../components/LegalKit'

// TODO: 隱私權政策全文待團隊提供（2026-10-12），補上後記得一起改 lib/termsConsent.js 的 TERMS_VERSION
export default function PrivacyPage() {
  return (
    <LegalPage title="隱私權政策">
      <Para>隱私權政策內容整理中，將於近期公告。</Para>
      <Para>如有任何個人資料相關問題，請來信至：diula.112ics@gmail.com。</Para>
    </LegalPage>
  )
}
