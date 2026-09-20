import MyItemsPage from '../components/MyItemsPage'

export default function MyFoundPage() {
  return (
    <MyItemsPage
      title="我的拾獲物"
      kind="found"
      detailBase="/my/found"
      emptyText="還沒有拾獲物紀錄。去「登錄拾獲物」登錄你撿到的東西吧！"
    />
  )
}
