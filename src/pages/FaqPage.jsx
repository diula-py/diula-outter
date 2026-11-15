import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LegalPage } from '../components/LegalKit'
import OnboardingTour from '../components/OnboardingTour'
import { ChevronDownIcon } from '../components/icons'

/**
 * 常見問題（FAQ）：個人頁底部「FAQ」連結的目的地。
 * 2026-11-16 開會定案：個人頁原本的「使用教學」連結改成 FAQ，使用教學放在 FAQ 裡重看。
 *
 * 版型沿用服務條款／隱私權政策（LegalPage：米色標頭＋返回鍵）。
 * 這頁不在 AppLayout 底下，收不到 openOnboarding() 的事件，所以「使用教學」在這頁自己開 OnboardingTour。
 * 重看不用再寫一次「看過」紀錄（會來 FAQ 的人第一次登入時就已經看過或跳過了）。
 *
 * ⚠ 問答內容是暫定的，PM 之後會給最終版，改 QUESTIONS 就好。
 * 「尋找／拾獲使用教學」是聚光燈導覽，要框首頁上的按鈕，所以點了先回到那個分頁再開
 * （帶 location.state.tour，見 OnboardingGate.jsx）。
 */

const TUTORIALS = [
  { key: 'first', label: '第一個使用教學', desc: '認識 DiuLa! 的主要功能' },
  { key: 'find', label: '尋找使用教學', desc: '「尋找」分頁的三個功能', path: '/' },
  { key: 'found', label: '拾獲使用教學', desc: '「拾獲」分頁的兩種登錄', path: '/found' },
]

const QUESTIONS = [
  {
    q: '怎麼找我掉的東西？',
    a: '到「尋找」分頁點「跨平台尋找遺失物」，上傳照片或用文字描述遺失物，AI 會自動加上分類標籤，一次查遍警政署、北捷、高鐵和 DiuLa! 的拾獲物。',
  },
  {
    q: '比對結果都沒有我的東西怎麼辦？',
    a: '點「都沒有我的物品」，可以開啟 5 日持續自動尋找並推播，或請 DiuLa! 幫你在 Threads 發匿名協尋文。',
  },
  {
    q: '自動推播會用什麼方式通知我？',
    a: '用 LINE 登入的話，會由 DiuLa! 的 LINE 官方帳號推播給你（需要先加官方帳號好友）；用 Google 登入的話，會寄到你登入帳號的信箱。',
  },
  {
    q: '撿到東西要怎麼登錄？',
    a: '到「拾獲」分頁，證件選「證件類遺失物登錄」，其他物品選「非證件類遺失物登錄」。登錄後，記得把物品交給警察局，或拾獲地點的管理單位。',
  },
  {
    q: '登錄證件會不會洩漏個資？',
    a: '證件照片要先打碼才能送出，身分證和健保卡會自動打碼，只有打碼後的照片會上傳。',
  },
  {
    q: '我登錄過的物品在哪裡看？',
    a: '到「個人」分頁的「我的遺失物」和「我的拾獲物」。',
  },
]

export default function FaqPage() {
  const navigate = useNavigate()
  const [tour, setTour] = useState(null)

  const play = (t) => {
    if (t.path) navigate(t.path, { state: { tour: t.key } })
    else setTour(t.key)
  }

  return (
    <LegalPage title="常見問題">
      <section>
        <h2 className="mb-3 text-base font-bold text-brown">使用教學</h2>
        <div className="flex flex-col gap-[10px]">
          {TUTORIALS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => play(t)}
              className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-black bg-card px-[15px] py-3 text-left text-brown
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            >
              <span className="flex flex-col gap-1">
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs opacity-70">{t.desc}</span>
              </span>
              <span className="shrink-0 text-xs font-medium underline">重新觀看</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-bold text-brown">常見問題</h2>
        <div className="flex flex-col gap-[10px]">
          {QUESTIONS.map(({ q, a }) => (
            <details key={q} className="group rounded-[10px] border border-black px-[15px] py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-brown [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
              </summary>
              <p className="mt-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {tour === 'first' && <OnboardingTour onClose={() => setTour(null)} />}
    </LegalPage>
  )
}
