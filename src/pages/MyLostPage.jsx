import MyItemsPage from '../components/MyItemsPage'

export default function MyLostPage() {
  return (
    <MyItemsPage
      title="我的遺失物"
      kind="lost"
      detailBase="/my/lost"
      emptyText="尚無符合條件的遺失物資料"
    />
  )
}
