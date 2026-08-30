import { Icon } from '../ui/Icon'
import { NotificationsBell } from './NotificationsBell'

export function Header({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between h-16 px-8 shrink-0">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">
          <Icon name="search" size={16} />
        </button>
        <NotificationsBell />
      </div>
    </header>
  )
}
