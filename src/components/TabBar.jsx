import { NavLink } from 'react-router-dom'

import { asset } from '../lib/asset'

const TABS = [
  { to: '/', icon: asset('/icons/house.png'), label: '首頁', end: true, left: 'left-[11px]' },
  { to: '/profile', icon: asset('/icons/user.png'), label: '個人', left: 'left-[184px]' },
]

/** 底部導覽列（inner）：340×65 淺藍膠囊，兩個 145×46 項目分別在 x=11、x=184、y=10，選中態白底圓角 42。 */
export default function TabBar() {
  return (
    <nav aria-label="主導覽" className="relative h-[65px] w-[340px] rounded-[50px] bg-blue">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          aria-label={tab.label}
          className={({ isActive }) =>
            `absolute top-[10px] flex h-[46px] w-[145px] items-center justify-center rounded-[42px] transition-colors duration-300 ${tab.left} ${
              isActive ? 'bg-paper' : ''
            }`
          }
        >
          <img src={tab.icon} alt="" aria-hidden="true" className="h-[35px] w-[35px] object-contain" />
        </NavLink>
      ))}
    </nav>
  )
}
