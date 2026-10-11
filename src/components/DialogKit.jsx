/**
 * 彈窗共用元件——尺寸與位置逐項抄 inner 的彈窗（logout-modal／notfound-home-confirm／
 * notfound-thread-success／notfound-modal／found-modal）。
 * 遮罩 rgba(0,0,0,.5)；「圖示 X」35×35 在 (11,10)；有陰影的彈窗用 0 4px 4px 25%。
 */
import { XmarkIcon } from './icons'

// 遮罩往下多延伸一個狀態列高度、底部再補同樣的內距（彈窗置中位置不變）：
// iPhone 主畫面 App（black-translucent）的 fixed 視窗高度少一個狀態列，inset-0 底部會露出一截頁面底色。
// 一般瀏覽器、電腦的 safe-area 是 0，不受影響。其他全螢幕遮罩（標籤彈窗、打碼視窗）同樣處理。
export function Overlay({ children, onClose }) {
  return (
    <div className="fixed inset-x-0 top-0 bottom-[calc(-1*env(safe-area-inset-top,0px))] z-[999] flex items-center justify-center bg-black/50 pb-[env(safe-area-inset-top,0px)]" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}

/** 米色 300×H 彈窗（inner 的 Frame）：內容用絕對位置，close 是左上角 X。 */
export function WireDialog({ height, onClose, closeSize = 35, label, children }) {
  return (
    <Overlay onClose={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative w-[300px] rounded-[10px] bg-card shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
        style={{ height }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="absolute left-[11px] top-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown"
            style={{ width: closeSize, height: closeSize }}
          >
            <XmarkIcon style={{ width: closeSize, height: closeSize }} />
          </button>
        )}
        {children}
      </div>
    </Overlay>
  )
}

/** 彈窗內置中的標題文字（20/500）。top 為相對彈窗上緣。 */
export function DialogTitle({ top, width, lineHeight = 20, children }) {
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 text-center text-xl font-medium"
      style={{ top, width, lineHeight: `${lineHeight}px` }}
    >
      {children}
    </div>
  )
}

/**
 * 彈窗內按鈕：絕對位置、border 1px、圓角 50、文字 20/500。tone：white／blue。
 * size="md"：文字 16/500（design.md 主要按鈕）、左右 padding 20（design.md 次要卡片 10px 20px），
 * 給字數多、20px 會塞滿按鈕的情況（如條款彈窗「同意並登入」）。
 */
export function DialogButton({ left, top, width, height = 60, tone = 'white', size = 'lg', onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`absolute box-border flex items-center justify-center rounded-[50px] border border-black font-medium text-brown disabled:opacity-60
                  ${size === 'md' ? 'whitespace-nowrap px-5 text-base' : 'text-xl'}
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brown
                  ${tone === 'blue' ? 'bg-blue' : 'bg-white'}`}
      style={{ left, top, width, height }}
    >
      {children}
    </button>
  )
}

/**
 * inner 的 found-modal（我找到了確認）：白底圓角 16、padding 24、寬 80% 最大 300，
 * 標題 20/700、說明 12 灰、兩顆按鈕（取消＝白底淺灰框、確定＝深褐底白字）。無陰影。
 */
export function ConfirmFoundModal({ onCancel, onConfirm, busy }) {
  return (
    <Overlay onClose={onCancel}>
      <div role="dialog" aria-modal="true" aria-label="確認已找到？" className="box-border w-[min(348px,calc(80vw+48px))] rounded-2xl bg-white p-6 text-center">
        <div className="mb-2 text-xl font-bold">確認已找到？</div>
        <div className="mb-6 text-xs font-normal text-[#888]">若確認已找到，該筆協尋記錄將結束</div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="box-border flex-1 rounded-3xl border border-[#E0E0E0] bg-white px-6 py-3 text-sm font-bold text-brown"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-3xl bg-[#492C13] px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? '更新中…' : '確定'}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

/** inner delete-modal（300×251）：「是否永久刪除此筆資料？」是（白）／否（藍）。我的遺失物／拾獲物共用。 */
export function DeleteConfirmModal({ onCancel, onConfirm, busy }) {
  return (
    <WireDialog height={251} onClose={onCancel} label="是否永久刪除此筆資料">
      <DialogTitle top={99} width={220}>是否永久刪除此筆資料？</DialogTitle>
      <DialogButton left={41} top={146} width={90} onClick={onConfirm} disabled={busy}>是</DialogButton>
      <DialogButton left={170} top={146} width={90} tone="blue" onClick={onCancel}>否</DialogButton>
    </WireDialog>
  )
}

/** 刪除 Threads 協尋文確認（樣式同「是否永久刪除此筆資料？」；標題兩行） */
export function DeleteThreadConfirmModal({ onCancel, onConfirm, busy }) {
  return (
    <WireDialog height={251} onClose={onCancel} label="是否刪除此則Threads協尋文">
      <DialogTitle top={79} width={246} lineHeight={24}>是否刪除此則<br />Threads協尋文？</DialogTitle>
      <DialogButton left={41} top={146} width={90} onClick={onConfirm} disabled={busy}>是</DialogButton>
      <DialogButton left={170} top={146} width={90} tone="blue" onClick={onCancel}>否</DialogButton>
    </WireDialog>
  )
}

/** inner delete-success-modal（300×230，無 X）：「該筆資料已被刪除！」＋ 置中藍色「確認」180×60。 */
export function DeleteSuccessModal({ onConfirm }) {
  return (
    <WireDialog height={230} label="該筆資料已被刪除">
      <DialogTitle top={80} width={262}>該筆資料已被刪除！</DialogTitle>
      <DialogButton left={60} top={140} width={180} tone="blue" onClick={onConfirm}>確認</DialogButton>
    </WireDialog>
  )
}
