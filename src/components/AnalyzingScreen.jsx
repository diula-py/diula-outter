import { WandIcon } from './icons'

/**
 * AI 辨識過場（inner page-loading）：淺藍底，170 圓 (112,207)、進度條 290×15 (51,456)、
 * 提示文字 15px／行距 18px 在 (47,561) 寬 299。
 *
 * 以上是 393×852 的位置。其他尺寸：
 * - 水平一律置中，窄螢幕左右至少留 20px（進度條、文字跟著縮短）。
 * - 垂直：整組（圓頂端 207 到提示文字底端約 597，共 390 高）的起點 --top 隨螢幕高度縮放，
 *   852 高時 (852 - 390) × 0.4481 ≈ 207；矮螢幕往上移、最少 40，提示文字才不會被切掉。
 */
export default function AnalyzingScreen({ pct, error, onRetry, children }) {
  return (
    <div className="relative mx-auto min-h-[calc(100dvh-var(--top-inset))] w-full max-w-[393px] overflow-hidden bg-[#CDDCF0] [--top:clamp(40px,calc((100dvh-var(--top-inset)-390px)*0.4481),207px)]">
      <div className="absolute left-[calc(50%-84.5px)] top-[var(--top)] flex h-[170px] w-[170px] items-center justify-center rounded-full bg-card">
        <WandIcon className="h-20 w-20" />
      </div>

      {error ? (
        <div className="absolute left-[max(20px,calc(50%-149.5px))] top-[calc(var(--top)+249px)] flex w-[min(299px,calc(100%-40px))] flex-col items-center gap-4 text-center">
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
          <div className="absolute left-[max(20px,calc(50%-145.5px))] top-[calc(var(--top)+249px)] h-[15px] w-[min(290px,calc(100%-40px))] overflow-hidden rounded-[10px] bg-white">
            <div
              className="h-full rounded-[10px] bg-brown opacity-70 transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="absolute left-[max(20px,calc(50%-149.5px))] top-[calc(var(--top)+354px)] w-[min(299px,calc(100%-40px))] text-center text-[15px] leading-[18px] text-black opacity-40">{children}</div>
        </>
      )}
    </div>
  )
}
