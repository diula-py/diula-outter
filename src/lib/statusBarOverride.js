// 讓頁面自己指定狀態列色帶的顏色（StatusBarColor 預設是依網址決定）。
// 用在「同一個網址、畫面會換」的頁面：例如 /search/subscribe 填表時有米色 header，
// 訂閱成功後換成沒有 header 的白底成功頁，色帶要跟著變白。
import { useEffect, useSyncExternalStore } from 'react'

let override = null
const listeners = new Set()

function set(color) {
  override = color
  listeners.forEach((l) => l())
}

export function useStatusBarOverrideValue() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l) },
    () => override,
  )
}

// color 為 null／undefined 時不覆蓋；離開頁面（unmount）自動清掉
export function useStatusBarColor(color) {
  useEffect(() => {
    if (!color) return
    set(color)
    return () => set(null)
  }, [color])
}
