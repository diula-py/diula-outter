import { useState } from 'react'
import { WireDialog, DialogTitle, DialogButton } from './DialogKit'

/**
 * 登入前的條款同意彈窗（米色 300×327，樣式同其他 WireDialog）。
 * 沒勾「我已閱讀並同意」前，「同意並登入」按不了。
 * onAgree 會在點擊當下同步呼叫：Google 登入的 popup 要在使用者點擊的同一個事件裡開，不能先 await 別的東西。
 */
export default function TermsConsentModal({ onCancel, onAgree, onOpenTerms, onOpenPrivacy }) {
  const [checked, setChecked] = useState(false)

  return (
    <WireDialog height={327} onClose={onCancel} label="使用者服務條款與隱私權政策">
      <DialogTitle top={55} width={246} lineHeight={26}>使用者服務條款<br />與隱私權政策</DialogTitle>
      <div className="absolute left-1/2 top-[120px] w-[246px] -translate-x-1/2 text-center text-xs font-normal leading-3 opacity-70">
        登入前請先閱讀並同意以下條款
      </div>
      <div className="absolute left-1/2 top-[144px] flex w-[246px] -translate-x-1/2 justify-center gap-6 text-sm font-medium leading-5 text-brown">
        <button type="button" onClick={onOpenTerms} className="underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
          服務條款
        </button>
        <button type="button" onClick={onOpenPrivacy} className="underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown">
          隱私權政策
        </button>
      </div>
      <label className="absolute left-1/2 top-[180px] flex -translate-x-1/2 cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-medium leading-5 text-brown">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="h-[18px] w-[18px] cursor-pointer accent-brown"
        />
        我已閱讀並同意
      </label>
      <DialogButton left={30} top={222} width={115} onClick={onCancel}>取消</DialogButton>
      <DialogButton left={155} top={222} width={115} tone="blue" onClick={onAgree} disabled={!checked}>同意並登入</DialogButton>
    </WireDialog>
  )
}
