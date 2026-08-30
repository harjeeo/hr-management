import { Icon } from '../ui/Icon'

export function Header({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between h-16 px-8 shrink-0">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">
          <Icon name="search" size={16} />
        </button>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">
          <Icon name="notification" size={16} />
          <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  )
}
