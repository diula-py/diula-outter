import MyItemsPage from '../components/MyItemsPage'

export default function MyFoundPage() {
  return (
    <MyItemsPage
      title="我的拾獲物"
      kind="found"
      detailBase="/my/found"
      emptyText="尚無符合條件的拾獲物資料"
    />
  )
}
