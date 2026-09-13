import liff from '@line/liff'

// 照搬 index.html 現有的 LIFF ID。
export const LIFF_ID = '2009840543-oj99U5pA'

let initPromise = null

export function initLiff() {
  if (!initPromise) {
    initPromise = liff.init({ liffId: LIFF_ID }).catch((error) => {
      console.error('LIFF 初始化失敗:', error)
      throw error
    })
  }
  return initPromise
}

export function isLiffLoggedIn() {
  try {
    return typeof liff.isLoggedIn === 'function' && liff.isLoggedIn()
  } catch (e) {
    return false
  }
}

export function getLiffProfile() {
  return liff.getProfile()
}

// 手機：Deep Link 喚醒 LINE App 並以 LIFF 開啟；電腦：未登入先呼叫 liff.login() 網頁登入。
// 邏輯照搬 index.html 的 handleLineLogin()。
export function loginWithLine() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (isMobile) {
    window.location.href = `https://liff.line.me/${LIFF_ID}`
  } else if (!isLiffLoggedIn()) {
    liff.login()
  } else {
    window.location.href = `https://liff.line.me/${LIFF_ID}`
  }
}

export function logoutLine() {
  if (isLiffLoggedIn()) {
    liff.logout()
  }
}

export default liff
