import { Icon } from '../ui/Icon'

interface EmployeesToolbarProps {
  onExport: () => void
  onAddNew: () => void
}

export function EmployeesToolbar({ onExport, onAddNew }: EmployeesToolbarProps) {
  return (
    <div className="flex items-center justify-end mb-4">
      <div className="flex items-center gap-2.5">
        <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
          <Icon name="filter" size={16} />
          Filter
        </button>
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
        >
          <Icon name="download" size={16} />
          Export
        </button>
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
        >
          <Icon name="plus" size={16} />
          Add New Employee
        </button>
      </div>
    </div>
  )
}
