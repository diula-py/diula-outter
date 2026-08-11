// public 資產路徑：加上 Vite base（GitHub Pages 子路徑會是 /diula-app/，dev 是 /）。
// 用法：asset('/icons/house.png') → dev '/icons/house.png'；prod '/diula-app/icons/house.png'
export const asset = (path) => import.meta.env.BASE_URL + path.replace(/^\//, '')
