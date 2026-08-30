import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from '../ui/Icon'
import { Avatar } from '../ui/Avatar'
import { menuItems, insightItems, type NavItem } from '../../data/nav'

function NavRow({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-gray-100 text-gray-900 font-medium'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="flex items-center gap-2.5">
            <Icon
              name={item.icon as IconName}
              size={18}
              className={isActive ? 'text-gray-900' : 'text-gray-400'}
            />
            {item.label}
          </span>
          {item.hasChildren && <Icon name="chevronDown" size={16} className="text-gray-400" />}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="w-[248px] shrink-0 h-screen sticky top-0 flex flex-col border-r border-gray-100 bg-white">
      <div className="flex items-center justify-between px-4 h-16 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white text-sm font-bold">H</span>
          </div>
          <span className="font-semibold text-gray-900 text-[15px]">HR Management</span>
        </div>
        <Icon name="sidebar" size={18} className="text-gray-400" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
        <p className="px-3 text-xs font-medium text-gray-400 mt-2 mb-1.5">Menu</p>
        <div className="flex flex-col gap-0.5">
          {menuItems.map((item) => (
            <NavRow key={item.path} item={item} />
          ))}
        </div>

        <p className="px-3 text-xs font-medium text-gray-400 mt-5 mb-1.5">Insights</p>
        <div className="flex flex-col gap-0.5">
          {insightItems.map((item) => (
            <NavRow key={item.path} item={item} />
          ))}
        </div>
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50">
          <Avatar name="Albert Flores" size={32} />
          <span className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900 leading-tight">Albert Flores</p>
            <p className="text-xs text-gray-400 leading-tight">albertf@gmail.com</p>
          </span>
          <Icon name="chevronUp" size={16} className="text-gray-400" />
        </button>
      </div>
    </aside>
  )
}
