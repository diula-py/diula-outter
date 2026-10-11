/** 服務條款／隱私權政策頁的共用版型：80px 米色標頭（返回鍵）＋ 一般捲動內文 ＋ 回到頂部鈕。登入前後都看得到。 */
import { useNavigate, useLocation } from 'react-router-dom'
import { FormHeader } from './FormKit'
import BackToTopButton from './BackToTopButton'

export function LegalPage({ title, updatedAt, children }) {
  const navigate = useNavigate()
  const location = useLocation()
  // 直接開網址（沒有上一頁）時回登入頁；已登入的話登入頁會自己跳回首頁
  const goBack = () => (location.key === 'default' ? navigate('/login', { replace: true }) : navigate(-1))

  return (
    <div className="flex min-h-[calc(100dvh-var(--top-inset))] flex-col items-center">
      <FormHeader title={title} onBack={goBack} />
      <article className="w-full max-w-[393px] px-6 pb-12 pt-6 text-sm leading-relaxed text-black">
        {children}
        {updatedAt && <p className="mt-8 text-xs opacity-60">最後更新日期：{updatedAt}</p>}
      </article>
      {/* 底部沒有其他按鈕，位置同 Threads 尋找遺失物頁 */}
      <BackToTopButton bottomClass="bottom-[calc(20px+env(safe-area-inset-bottom))]" />
    </div>
  )
}

/** 一條（第Ｘ條　標題） */
export function Article({ title, children }) {
  return (
    <section className="mt-6 first:mt-0">
      <h2 className="mb-2 text-base font-bold text-brown">{title}</h2>
      {children}
    </section>
  )
}

/** 第五條底下的「一、二、三…」小節 */
export function SubSection({ title, children }) {
  return (
    <div className="mt-3">
      <h3 className="mb-1 font-medium text-brown">{title}</h3>
      {children}
    </div>
  )
}

export function Items({ children }) {
  return <ol className="list-decimal space-y-1 pl-5 [&_ol]:mt-1 [&_ol]:list-[lower-alpha]">{children}</ol>
}

export function Para({ children }) {
  return <p className="mb-2">{children}</p>
}

export function Bullets({ children }) {
  return <ul className="list-disc space-y-1 pl-5">{children}</ul>
}

/**
 * 原文的表格（如「蒐集之個人資料類別」）：手機寬度放不下多欄，改成一列一張卡片，
 * 第一欄當卡片標題，其餘欄位「欄名：內容」上下排。rows 每列是字串陣列，順序同 columns。
 */
export function InfoCards({ columns, rows }) {
  return (
    <div className="my-3 space-y-[10px]">
      {rows.map((row) => (
        <div key={row[0]} className="rounded-[10px] border border-black px-[15px] py-[10px]">
          <div className="mb-1 font-bold text-brown">{row[0]}</div>
          <dl className="space-y-1">
            {columns.slice(1).map((col, i) => (
              <div key={col}>
                <dt className="inline font-medium text-brown">{col}：</dt>
                <dd className="inline">{row[i + 1]}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}
