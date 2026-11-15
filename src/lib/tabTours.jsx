import { asset } from './asset'

// 「尋找使用教學」「拾獲使用教學」的步驟與文案（2026-11-16 開會定案，草稿見
// https://claude.ai/artifact/AaBMNLHsdni16bpPwXN9mN）。
// targets 對應畫面上元素的 data-tour 值：首頁按鈕在 lib/homeMenuItems.js 的 tour 欄位，
// 問號鈕在 SectionTitle（`${tour}-help`）。
// 「忘了怎麼用？」只放在拾獲使用教學最後一步，尋找使用教學不放（兩個教學只出現一次）。

const NOTE_FOUND = (
  <span className="mt-[6px] block text-error">登錄後，記得把物品交給警察局，或拾獲地點的管理單位喔！</span>
)

export const TOURS = {
  find: {
    label: '尋找使用教學',
    steps: [
      {
        targets: ['find-cross'],
        title: '跨平台尋找遺失物',
        body: (
          <>
            上傳照片或用文字描述遺失物，AI 會自動加上分類標籤，接著就能一次查遍四大平台的拾獲物。
            <span className="mt-1 block text-xs text-[#9a8573]">警政署、北捷、高鐵、DiuLa!</span>
          </>
        ),
      },
      {
        targets: ['find-recent'],
        title: '近 2 日遺失物快速看',
        body: '不用輸入任何描述，直接瀏覽各平台近 2 日新登錄的拾獲物，還能依物品分類篩選。',
      },
      {
        targets: ['find-cross', 'find-recent'],
        title: '還是找不到嗎？',
        body: '在這兩個功能內點擊「都沒有我的物品」就能開啟 5日持續自動尋找並推播，或請 DiuLa! 幫你在 Threads 發匿名協尋文。',
      },
      {
        targets: ['find-threads'],
        title: 'Threads協尋文精準搜',
        body: '只搜 Threads 上的遺失物相關串文，不被無關串文干擾，看看有沒有人撿到你的東西。',
      },
    ],
  },
  found: {
    label: '拾獲使用教學',
    steps: [
      {
        targets: ['found-id'],
        title: '證件類遺失物登錄',
        body: <>撿到證件？拍照、打碼、填時間地點就能登錄，身分證和健保卡還會自動打碼！{NOTE_FOUND}</>,
      },
      {
        targets: ['found-other'],
        title: '非證件類遺失物登錄',
        body: <>將非證件的物品拍一張照片，AI 會幫你產生標籤，再填時間和地點就能登錄。{NOTE_FOUND}</>,
      },
      {
        targets: ['found-help'],
        title: '忘了怎麼用？',
        body: (
          <>
            點標題旁邊的
            <img src={asset('/icons/circle-question.png')} alt="問號" className="mx-[2px] inline-block h-[1.15em] w-[1.15em] align-[-0.2em]" />
            ，隨時可以再看一次這個教學。
          </>
        ),
      },
    ],
  },
}

// 分頁網址 → 導覽（手機版「尋找」在 '/'、「拾獲」在 '/found'）
export const TOUR_BY_PATH = { '/': 'find', '/found': 'found' }
