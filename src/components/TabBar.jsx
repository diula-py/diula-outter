import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', icon: '/icons/house.png', label: '首頁', end: true },
  { to: '/profile', icon: '/icons/user.png', label: '個人' },
]

/** 底部導覽列：淺藍膠囊，選中的分頁底色轉白（圓角 42px）。 */
export default function TabBar() {
  return (
    <nav aria-label="主導覽" className="flex h-[65px] items-center gap-2 rounded-[50px] bg-blue p-2">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          aria-label={tab.label}
          className={({ isActive }) =>
            `flex h-full flex-1 items-center justify-center rounded-[42px] transition ${
              isActive ? 'bg-base' : ''
            }`
          }
        >
          <img src={tab.icon} alt="" aria-hidden="true" className="h-[30px] w-[30px] object-contain" />
        </NavLink>
      ))}
    </nav>
  )
}
