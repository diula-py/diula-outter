import { WandIcon } from './icons'

/**
 * AI 辨識過場（inner page-loading）：淺藍底，170 圓 (112,207)、進度條 290×15 (51,456)、
 * 提示文字 15px／行距 18px 在 (47,561) 寬 299。
 */
export default function AnalyzingScreen({ pct, error, onRetry, children }) {
  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[393px] overflow-hidden bg-[#CDDCF0]">
      <div className="absolute left-[112px] top-[207px] flex h-[170px] w-[170px] items-center justify-center rounded-full bg-card">
        <WandIcon className="h-20 w-20" />
      </div>

      {error ? (
        <div className="absolute left-[47px] top-[456px] flex w-[299px] flex-col items-center gap-4 text-center">
          <p className="text-[15px] leading-normal text-error">AI 辨識失敗：{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="h-11 rounded-[50px] border border-black bg-white px-6 text-sm font-medium text-brown"
            >
              返回重試
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="absolute left-[51px] top-[456px] h-[15px] w-[290px] overflow-hidden rounded-[10px] bg-white">
            <div
              className="h-full rounded-[10px] bg-[#482B12] opacity-70 transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="absolute left-[47px] top-[561px] w-[299px] text-center text-[15px] leading-[18px] text-black opacity-40">{children}</div>
        </>
      )}
    </div>
  )
}
