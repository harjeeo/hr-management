import { useState } from 'react'
import type { Lead } from '../../data/leads'
import { StatusPill } from './StatusPill'
import { Icon } from '../ui/Icon'
import { Avatar } from '../ui/Avatar'

const columns = ['Leads', 'Subject', 'Activities', 'Status', 'Created', 'Actions'] as const

interface LeadsTableProps {
  leads: Lead[]
  selectedId?: string
  onRowClick: (lead: Lead) => void
}

export function LeadsTable({ leads, selectedId, onRowClick }: LeadsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allSelected = selected.size > 0 && selected.size === leads.length

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(leads.map((l) => l.id)))
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
              <th
                key={col}
                className="text-left font-medium text-gray-500 py-3 pr-4 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onRowClick(lead)}
              className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50/60 ${
                selectedId === lead.id ? 'bg-gray-50' : ''
              }`}
            >
              <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.has(lead.id)}
                  onChange={() => toggleOne(lead.id)}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                />
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={lead.name} size={32} />
                  <span className="font-medium text-gray-900 whitespace-nowrap">{lead.name}</span>
                </div>
              </td>
              <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{lead.subject}</td>
              <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="phone" size={14} className="text-gray-400" />
                  {lead.activityDate}
                </span>
              </td>
              <td className="py-3 pr-4">
                <StatusPill status={lead.status} />
              </td>
              <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" size={14} className="text-gray-400" />
                  {lead.createdAgo}
                </span>
              </td>
              <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRowClick(lead)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50"
                  >
                    <Icon name="edit" size={14} />
                    Edit
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100">
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
