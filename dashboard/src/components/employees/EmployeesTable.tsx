import { useState } from 'react'
import type { Employee } from '../../types/hr'
import { EmployeeStatusPill } from './EmployeeStatusPill'
import { Icon } from '../ui/Icon'
import { Avatar } from '../ui/Avatar'

const columns = ['Employees', 'Designation', 'Department', 'Status', 'Joined', 'Actions'] as const

function timeAgo(iso?: string | null) {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days < 1) return 'today'
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''} ago`
}

interface EmployeesTableProps {
  employees: Employee[]
  selectedId?: string
  onRowClick: (employee: Employee) => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export function EmployeesTable({ employees, selectedId, onRowClick, onEdit, onDelete }: EmployeesTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allSelected = selected.size > 0 && selected.size === employees.length

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(employees.map((e) => e.id)))
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="w-10 py-3 pl-4">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-300 accent-gray-900"
              />
            </th>
            {columns.map((col) => (
              <th key={col} className="text-left font-medium text-gray-500 py-3 pr-4 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr
              key={emp.id}
              onClick={() => onRowClick(emp)}
              className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50/60 ${
                selectedId === emp.id ? 'bg-gray-50' : ''
              }`}
            >
              <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.has(emp.id)}
                  onChange={() => toggleOne(emp.id)}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                />
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={emp.fullName} size={32} />
                  <div>
                    <p className="font-medium text-gray-900 whitespace-nowrap">{emp.fullName}</p>
                    <p className="text-xs text-gray-400 whitespace-nowrap">{emp.employeeCode}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{emp.designation?.title ?? '—'}</td>
              <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="projects" size={14} className="text-gray-400" />
                  {emp.department?.name ?? '—'}
                </span>
              </td>
              <td className="py-3 pr-4">
                <EmployeeStatusPill status={emp.employmentStatus} />
              </td>
              <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" size={14} className="text-gray-400" />
                  {timeAgo(emp.joiningDate)}
                </span>
              </td>
              <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(emp)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50"
                  >
                    <Icon name="edit" size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(emp)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100"
                  >
                    <Icon name="delete" size={14} />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
