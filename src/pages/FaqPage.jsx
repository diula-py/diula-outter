import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LegalPage } from '../components/LegalKit'
import OnboardingTour from '../components/OnboardingTour'

/**
 * 常見問題（FAQ）：個人頁底部「FAQ」連結的目的地。
 * 2026-11-16 開會定案：個人頁原本的「使用教學」連結改成 FAQ，使用教學放在 FAQ 裡重看。
 *
 * 版型沿用服務條款／隱私權政策（LegalPage：米色標頭＋返回鍵）。
 * 這頁不在 AppLayout 底下，收不到 openOnboarding() 的事件，所以「使用教學」在這頁自己開 OnboardingTour。
 * 重看不用再寫一次「看過」紀錄（會來 FAQ 的人第一次登入時就已經看過或跳過了）。
 * 「尋找／拾獲使用教學」是聚光燈導覽，要框首頁上的按鈕，所以點了先回到那個分頁再開
 * （帶 location.state.tour，見 OnboardingGate.jsx）。
 *
 * 2026-11-21 改成「主題標籤切換」版型（設計稿：D 主題標籤切換-html/FaqTabs.dc.html），
 * 文案來源：「DiuLa! 常見問題（FAQ）文案.md」（11/18）。改題目只要改 SECTIONS。
 * 回答由區塊組成：p 段落、note 小字附註、ol 編號清單、ul 圓點清單、links 外部連結。
 * 清單項目若在前 12 字內有「：」，冒號前（含）會變粗體；超過 12 字也要粗體的，寫成 { b: 粗體, x: 其餘 }。
 */

const TUTORIALS = [
  { key: 'first', label: '入門使用教學', desc: '認識 DiuLa! 的主要功能' },
  { key: 'find', label: '尋找使用教學', desc: '「尋找」分頁的三個功能', path: '/' },
  { key: 'found', label: '拾獲使用教學', desc: '「拾獲」分頁的兩種登錄', path: '/found' },
]

const SECTIONS = [
  {
    title: '尋找遺失物',
    qs: [
      {
        q: '怎麼找我掉的東西？',
        a: [
          { t: 'p', x: '到「跨平台尋找遺失物」，拍照或描述物品、填入遺失地點和日期，AI會自動辨識物品並分類標籤，確認標籤後按下查詢。DiuLa! 會一次比對警政署、臺北捷運、台灣高鐵和 DiuLa! 使用者登錄的拾獲物，把可能是你的東西列出來。剛掉東西的話，也可以先看「近 2 日遺失物」，快速瀏覽最新的拾獲物。想看更多介紹，可以點上方的「尋找使用教學」。' },
        ],
      },
      {
        q: 'DiuLa! 可以查到哪些地方的遺失物？',
        a: [
          { t: 'p', x: 'DiuLa! 整合了四個來源：警政署拾得遺失物管理系統、臺北捷運、台灣高鐵，以及 DiuLa! 使用者登錄的拾獲物，在「跨平台尋找遺失物」查一次就能同時比對。另外也可以用「Threads 尋找遺失物」，找網友在 Threads 上發的拾獲文。百貨公司、演唱會等場所的遺失物目前沒有整合，可以參考FAQ「其他尋找管道」。' },
          { t: 'note', x: '臺北捷運遺失物資訊由臺北大眾捷運股份有限公司提供。' },
        ],
      },
      {
        q: '遺失地點要怎麼填？',
        a: [
          { t: 'p', x: '先回想東西可能是在哪裡掉的，再點選那個地點的縣市和區，例如「臺北市文山區」。如果是在捷運、火車、高鐵等大眾運輸上，或是在車站裡、車站附近掉的，請填該站所在的縣市區。在車上遺失的話，建議先填你下車的那一站；不確定時，也可以換成上車站再查一次。' },
        ],
      },
      {
        q: '不確定是哪一天掉的，日期要怎麼填？',
        a: [
          { t: 'p', x: '填一個大概的日期就可以。系統會比對你填的日期「前 5 天到後 30 天」內被拾獲的物品，所以就算差了幾天也找得到。如果只記得是某幾天之間，建議填最早可能的那一天。' },
        ],
      },
      {
        q: 'Threads 尋找遺失物和跨平台尋找遺失物、近2日遺失物快速看有什麼不同？',
        a: [
          { t: 'p', x: '「跨平台尋找遺失物」、「近2日遺失物快速看」查詢的是警政署、捷運、高鐵和 DiuLa! 上的拾獲物資料。網友自己在 Threads 上發的拾獲文不在這些資料裡，要另外用「Threads 尋找遺失物」，輸入物品名稱或地點等關鍵字來找。兩種都查一遍，找到的機會更大。' },
        ],
      },
      {
        q: '可以幫我在 Threads 發協尋文嗎？',
        a: [
          { t: 'p', x: '可以。DiuLa! 會用官方 Threads 帳號幫你匿名發文，不會顯示你的 Threads 帳號與 DiuLa! 帳號。流程如下：' },
          {
            t: 'ol',
            i: [
              '在「跨平台尋找遺失物」或「近2日遺失物快速看」的結果中，點「都沒有我的物品」。',
              '選擇「幫我在Threads發協尋文」。',
              '填寫物品的詳細資訊，照片可以先打碼。',
              '送出後，我們會在 2 個工作天內審核並發布，發布後會通知你。',
            ],
          },
          { t: 'p', x: '填寫時請確認內容沒有你的電話、地址等個人資料。發布後，也可以在「個人」頁找到協尋文的連結。' },
        ],
      },
    ],
  },
  {
    title: '比對與通知',
    qs: [
      {
        q: '比對結果都沒有我的東西怎麼辦？',
        a: [
          { t: 'p', x: '先別灰心，可以試試這幾個方法：' },
          {
            t: 'ol',
            i: [
              '等通知：在查詢結果點「都沒有我的物品」，選擇「開啟自動尋找並推播」，接下來 5 天系統會持續比對新登錄的拾獲物，一有符合的就通知你。用 Google 帳號登入會寄到你的 Gmail，用 LINE 登入則由 DiuLa! 的 LINE 官方帳號傳訊息給你。',
              { b: '匿名發 Threads 協尋文：', x: '在查詢結果點「都沒有我的物品」，選擇「幫我在Threads發協尋文」，DiuLa! 會用官方 Threads 帳號幫你發文，不會顯示你的帳號。' },
              '放寬條件：換成鄰近的縣市區、把日期往前調，或換一個物品類別再查一次。',
              '找找 Threads：用「Threads 尋找遺失物」查網友發的拾獲文。',
              '直接問官方：東西剛掉不久時，可能還沒登錄到系統，可以先打電話或到服務台詢問，做法見「其他尋找管道」。',
            ],
          },
        ],
      },
      {
        q: '送出查詢後，系統會幫我追蹤多久？',
        a: [
          { t: 'p', x: '系統會在 5 天內持續比對新登錄的拾獲物，一旦出現符合的物品就會通知你。5 天後如果還沒找到，可以再送出一次查詢，重新開始追蹤。' },
        ],
      },
      {
        q: '自動推播會用什麼方式通知我？',
        a: [
          { t: 'p', x: '通知方式依你的登入方式而定：用 Google 帳號登入會寄到你的 Gmail，用 LINE 登入則由 DiuLa! 的 LINE 官方帳號傳訊息給你。用 LINE 登入的話，請先加入 DiuLa! 的 LINE 官方帳號好友，才收得到訊息。' },
        ],
      },
      {
        q: '找到疑似是我的東西，要怎麼領回？',
        a: [
          { t: 'p', x: 'DiuLa! 是整合遺失物資訊的平台，不會保管物品。點開物品資訊可以看到保管單位（例如派出所、捷運站或高鐵站），可以先打電話確認，在出發前也可以先查詢該保管單位的領取規定，再前往領取。' },
        ],
      },
    ],
  },
  {
    title: '登錄拾獲物',
    qs: [
      {
        q: '撿到東西要怎麼登錄？',
        a: [
          { t: 'p', x: '到「登錄拾獲物」頁，3 步就能完成：拍下物品照片、填寫拾獲及送往的地點和時間、確認後送出。系統會用 AI 自動判斷物品類別，不用自己分類。若撿到的是證件，請選「證件類遺失物登錄」，需先將照片上的個資打碼再進行後續操作。想看操作示範，可以點上方的「拾獲使用教學」。' },
        ],
      },
      {
        q: '登錄完，東西要交給誰？',
        a: [
          { t: 'p', x: 'DiuLa! 的登錄是讓尋找者更快知道東西在哪，東西本身還是要交給有保管責任的單位。建議盡快交給附近的派出所；在車站、百貨公司、學校等場所撿到的，也可以交給該場所的服務台或管理人員。依民法第 803 條，撿到遺失物應該盡快通知物主，或報告警察並把東西一起交存。' },
        ],
      },
      {
        q: '沒有網路的時候，還能用哪些功能？',
        a: [
          { t: 'p', x: '可以使用以下三個功能。建議先把 DiuLa! 加到手機主畫面，離線時開啟比較順：' },
          {
            t: 'ul',
            i: [
              '近2日遺失物快速看：顯示你之前在這支手機上看過的資料，連上網路後才會更新。',
              { b: 'Threads 尋找遺失物：', x: '同樣顯示之前看過的資料。' },
              '非證件類遺失物登錄：可以先拍照、填好資料，等連上網路再自動上傳。證件類登錄需要連網路才能使用。',
            ],
          },
        ],
      },
    ],
  },
  {
    title: '個資與安全',
    qs: [
      {
        q: '登錄證件會不會洩漏個資？',
        a: [
          { t: 'p', x: '不會。登錄身分證或健保卡時，系統會自動遮住姓名、證號、出生日期等個人資料，打碼後才會公開。送出前請再看一次預覽，確認重要資訊都有被遮住。' },
        ],
      },
      {
        q: '撿到的不是身分證或健保卡，也會自動打碼嗎？',
        a: [
          { t: 'p', x: '目前自動打碼只支援身分證和健保卡。其他證件或卡片（例如學生證、駕照、信用卡），請在登錄時自己把姓名、號碼和照片遮住再送出。' },
        ],
      },
      {
        q: '我的 Gmail 或 LINE 資料會被拿來做什麼？',
        a: [{ t: 'p', x: '只會用來寄送比對結果和追蹤通知，不會公開在平台上，也不會提供給其他人。' }],
      },
    ],
  },
  {
    title: '其他尋找管道',
    qs: [
      {
        q: '東西掉在台鐵、高鐵或捷運上，還有其他方法可以找嗎？',
        a: [
          { t: 'p', x: '有。DiuLa! 查得到這些單位公告的遺失物，但東西被撿到後，要先送到服務台、登錄上網，才會出現在查詢結果裡。如果剛掉不久，建議同時透過官方管道詢問，例如馬上到站務室請人員聯繫列車，或打客服專線登記。各單位的官方管道尋找辦法，我們整理在這幾篇貼文：' },
          {
            t: 'links',
            i: [
              { l: '台灣鐵路遺失物協尋指南', h: 'https://www.instagram.com/p/Dc3ekXnElNe/' },
              { l: '台灣高鐵遺失物協尋指南', h: 'https://www.instagram.com/p/Dcn4vzzEjDc/' },
              { l: '臺北捷運遺失物協尋指南', h: 'https://www.instagram.com/p/DcTnCCWEimP/' },
            ],
          },
        ],
      },
      {
        q: '在百貨公司、演唱會等大型活動掉東西，DiuLa! 找得到嗎？',
        a: [
          { t: 'p', x: '這類場所的遺失物資訊目前沒有整合進 DiuLa!，通常由場館或主辦單位自己保管。我們在社群上整理了知識型貼文，告訴你該找哪個單位、怎麼找：' },
          {
            t: 'links',
            i: [
              { l: '百貨公司遺失物協尋指南', h: 'https://www.instagram.com/p/DfZ0rLmElGX/' },
              { l: '演唱會、大型活動遺失物協尋指南', h: 'https://www.instagram.com/p/DfrxemVEoPy/' },
            ],
          },
          { t: 'p', x: '如果東西後來被交到警察局，或有人在 DiuLa! 登錄，還是可能出現在查詢結果中，建議也用 DiuLa! 查一次。' },
        ],
      },
    ],
  },
  {
    title: '使用與帳號',
    qs: [
      {
        q: '需要下載 App 嗎？',
        a: [
          { t: 'p', x: '不用。DiuLa! 打開網頁就能用，也可以從 LINE 開啟。常用的話，可以把它加到手機主畫面，用起來就像 App 一樣：' },
          {
            t: 'ul',
            i: [
              'iPhone：用 Safari 開啟，點「分享」→「加入主畫面」',
              'Android：用 Chrome 開啟，點右上角選單 →「加到主畫面」或「安裝應用程式」',
            ],
          },
        ],
      },
      {
        q: '我登錄過的物品在哪裡看？',
        a: [{ t: 'p', x: '點導覽列的「個人」，就能看到你所有的尋找和拾獲紀錄，包括追蹤狀態和發布的Threads協尋文連結。' }],
      },
      {
        q: '東西找到了，要怎麼結案？',
        a: [{ t: 'p', x: '到「我的遺失物」點開那筆案件，按「我找到了！立即更新狀態」即可標記為「已找到」，也可以刪除該筆資料與Threads協尋文。' }],
      },
      {
        q: '想刪除登錄過的拾獲物，要怎麼做？',
        a: [{ t: 'p', x: '到「我的拾獲物」點開那筆拾獲紀錄，就可以刪除。刪除後，其他人就查不到這筆資料；東西如果已經交給派出所或服務台，尋找者還是可以到那裡領回。' }],
      },
    ],
  },
]

/** 清單項目：前 12 字內有「：」→ 冒號前（含）粗體 */
function splitLead(text) {
  // 冒號超過 12 字還要粗體的項目，直接寫成 { b: 粗體, x: 其餘 }
  if (typeof text === 'object') return [text.b, text.x]
  const i = text.indexOf('：')
  return i > 0 && i <= 12 ? [text.slice(0, i + 1), text.slice(i + 1)] : ['', text]
}

function ListItemText({ text }) {
  const [lead, rest] = splitLead(text)
  return (
    <span className="min-w-0 flex-1">
      {lead && <strong className="font-bold">{lead}</strong>}
      {rest}
    </span>
  )
}

function AnswerBlock({ b }) {
  if (b.t === 'p') return <p className="m-0">{b.x}</p>
  if (b.t === 'note') return <p className="m-0 text-[13px] leading-[1.6] opacity-75">{b.x}</p>
  if (b.t === 'ol')
    return (
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {b.i.map((it, k) => (
          <li key={k} className="flex items-start gap-[10px]">
            <span className="mt-[3px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brown text-xs font-bold text-white">
              {k + 1}
            </span>
            <ListItemText text={it} />
          </li>
        ))}
      </ol>
    )
  if (b.t === 'ul')
    return (
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {b.i.map((it, k) => (
          <li key={k} className="flex items-start gap-[10px]">
            <span className="mt-[11px] h-[6px] w-[6px] shrink-0 rounded-full bg-brown" />
            <ListItemText text={it} />
          </li>
        ))}
      </ul>
    )
  if (b.t === 'links')
    return (
      <ul className="m-0 flex list-none flex-col gap-[6px] p-0">
        {b.i.map((it) => (
          <li key={it.h} className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F5FBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
              <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
              <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
            </svg>
            <a href={it.h} target="_blank" rel="noopener noreferrer" className="font-medium text-[#1F5FBF] underline underline-offset-[3px] hover:text-[#174A94]">
              {it.l}
            </a>
          </li>
        ))}
      </ul>
    )
  return null
}

export default function FaqPage() {
  const navigate = useNavigate()
  const [tour, setTour] = useState(null)
  const [topic, setTopic] = useState(0)
  // 展開狀態以「主題-題號」記，切換主題再切回來會保留；一打開全部收合（2026-11-23 改，不照設計稿預設展開第一題）
  const [open, setOpen] = useState({})

  const play = (t) => {
    if (t.path) navigate(t.path, { state: { tour: t.key } })
    else setTour(t.key)
  }
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))
  const current = SECTIONS[topic]

  return (
    <>
    <LegalPage title="常見問題">
      <div className="flex flex-col gap-7 text-brown">
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-xl font-bold tracking-[1px]">使用教學</h2>
          <div className="rounded-[24px] bg-card px-4 py-1">
            {TUTORIALS.map((t, i) => (
              <button
                key={t.key}
                type="button"
                onClick={() => play(t)}
                aria-label={`重新觀看${t.label}`}
                className={`flex w-full items-center gap-[14px] py-3 text-left text-brown
                            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                            ${i < TUTORIALS.length - 1 ? 'border-b border-[#E0D6C1]' : ''}`}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="text-base font-bold leading-[1.4]">{t.label}</span>
                  <span className="text-[13px] leading-[1.4] opacity-75">{t.desc}</span>
                </span>
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brown text-white">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.8l-10-6.5A1 1 0 0 0 8 5.5z" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="m-0 text-xl font-bold tracking-[1px]">常見問題</h2>
          <div className="grid grid-cols-3 gap-2">
            {SECTIONS.map((s, si) => {
              const sel = si === topic
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setTopic(si)}
                  aria-pressed={sel}
                  className={`min-h-11 rounded-full border-black px-[6px] text-sm font-bold text-brown
                              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                              ${sel ? 'border-[1.5px] bg-card' : 'border bg-input'}`}
                >
                  {/* 行高的上下留白照 Comfortaa 算，中文字會偏上約 1px，往下移才會在膠囊正中 */}
                  <span className="relative top-px">{s.title}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col">
            {current.qs.map((q, qi) => {
              const id = `${topic}-${qi}`
              const isOpen = !!open[id]
              return (
                <div key={id} className="border-b border-[#E6DFCF]">
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    aria-expanded={isOpen}
                    className="flex min-h-14 w-full items-center gap-3 py-[14px] text-left text-base font-medium leading-[1.5] text-brown
                               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
                  >
                    <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brown text-sm font-bold text-white">
                      {/* Comfortaa 的字身在行高裡偏上，往下移 1px 才會在圓圈正中 */}
                      <span className="translate-y-px">Q</span>
                    </span>
                    <span className="min-w-0 flex-1">{q.q}</span>
                    <svg
                      width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                      className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="flex items-start gap-3 pb-5">
                      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-brown text-sm font-bold">
                        <span className="translate-y-px">A</span>
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-[10px] text-[15px] leading-[1.75]">
                        {q.a.map((b, k) => <AnswerBlock key={k} b={b} />)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </LegalPage>

    {/* 放在 LegalPage 外面：LegalPage 會把 children 渲染兩份（手機版＋桌機版），
        放裡面會同時開兩個教學，兩個各自鎖／還原 html 捲動，關掉後捲動會一直被鎖住 */}
    {tour === 'first' && <OnboardingTour onClose={() => setTour(null)} />}
    </>
  )
}
