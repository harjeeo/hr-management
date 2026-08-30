import { Icon } from '../ui/Icon'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function getPageList(current: number, total: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []
  const add = (p: number | 'ellipsis') => pages.push(p)

  add(1)
  if (current > 3) add('ellipsis')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    add(p)
  }
  if (current < total - 2) add('ellipsis')
  if (total > 1) add(total)

  return pages
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = getPageList(currentPage, totalPages)

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-40"
      >
        <Icon name="chevronDown" size={16} className="rotate-90" />
      </button>
      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
              p === currentPage
                ? 'bg-gray-900 text-white font-medium'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-40"
      >
        <Icon name="chevronDown" size={16} className="-rotate-90" />
      </button>
    </div>
  )
}
