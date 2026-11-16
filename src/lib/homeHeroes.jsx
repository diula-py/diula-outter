import { asset } from './asset'

// 「尋找」手機版插圖 hero：HomePage.jsx 用它當 hero，桌機版合併頁（HomeTabPage.jsx
// 的 lg: 區塊）的輪播也用同一份，兩邊視覺要一模一樣。
export const FIND_HERO = {
  bg: 'rgba(252, 230, 183, 0.6)', // 設計稿：黃底
  image: { src: asset('/icons/illustration-search.svg'), size: 145, right: 11.5, textRight: 192 }, // 放大鏡插圖（動畫：CSS keyframes 寫在 SVG 裡，要用 <img> 載入才會動）
  content: (
    <>
      <p className="absolute left-[24.5px] top-[26px] w-[156px] text-2xl font-bold leading-[26px]">東西不見了<br />別擔心</p>
      <img src={asset('/icons/diula-logo-cropped.png')} alt="DiuLa!" className="absolute left-[24.5px] top-[97px] h-5" />
      <p className="absolute left-[24.5px] top-[124px] text-sm font-normal leading-5">是你與失物重逢的捷徑</p>
      <p className="absolute left-[24.5px] top-[143px] text-xs font-normal leading-5">省時省力｜自動尋找｜擴大協尋</p>
    </>
  ),
  // 桌機版輪播用：跟手機版一樣的插圖／文案，但排版換成大尺寸的 flex（原本手機版
  // content 是絕對定位、照 350×190 的小卡片調的，放大會整組擠在左上角，要另外排）。
  desktop: {
    title: ['東西不見了', '別擔心'],
    subtitle: '是你與失物重逢的捷徑',
    tagline: '省時省力｜自動尋找｜擴大協尋',
  },
}

// 「拾獲」手機版插圖 hero：FoundHomePage.jsx 用它當 hero，桌機版合併頁的輪播也用同一份。
export const FOUND_HERO = {
  bg: '#EAE9D5', // 設計稿：綠底
  image: { src: asset('/icons/illustration-found.svg'), size: 170, right: 3.5, textRight: 176.5 }, // 拿證件的小人（動畫：CSS keyframes 寫在 SVG 裡，要用 <img> 載入才會動；直式圖，在正方形框內 object-contain 置中）
  // 直式圖在 170 方框裡實際只佔中間約 123 寬，框左邊約 24px 是透明的，所以 textRight 設到 176.5（350−170−3.5）讓 350 寬卡片能放滿 170，文字也不會被壓到
  content: (
    <>
      <p className="absolute left-[24.5px] top-[26px] w-[170px] text-2xl font-bold leading-[26px]">拾獲物品<br />輕鬆快速登錄</p>
      <p className="absolute left-[24.5px] top-[85px] text-sm font-normal leading-5">做好事，也將收穫好事！</p>
      <p className="absolute left-[24.5px] top-[129px] text-xs font-normal leading-4">證件個資打碼，保護失主隱私<br />登錄物品後送交鄰近機關單位</p>
    </>
  ),
  desktop: {
    title: ['拾獲物品', '輕鬆快速登錄'],
    subtitle: '做好事，也將收穫好事！',
    tagline: '證件個資打碼，保護失主隱私，登錄物品後送交鄰近機關單位',
  },
}
