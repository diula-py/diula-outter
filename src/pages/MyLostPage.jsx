import MyItemsPage from '../components/MyItemsPage'

export default function MyLostPage() {
  return (
    <MyItemsPage
      title="我的遺失物"
      kind="lost"
      detailBase="/my/lost"
      emptyText="還沒有協尋紀錄。去「跨平台尋找遺失物」發起協尋吧！"
    />
  )
}
