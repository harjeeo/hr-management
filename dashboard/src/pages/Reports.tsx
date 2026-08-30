import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { API_ORIGIN, getToken } from '../lib/api'

type ReportKind = 'employees' | 'attendance' | 'leave' | 'payroll'

const reports: { key: ReportKind; label: string; description: string; hasDateRange?: boolean; hasMonth?: boolean }[] = [
  { key: 'employees', label: 'Employee Report', description: 'Full employee directory with branch/department/designation' },
  { key: 'attendance', label: 'Attendance Report', description: 'Daily attendance records for a date range', hasDateRange: true },
  { key: 'leave', label: 'Leave Report', description: 'Leave requests for a date range', hasDateRange: true },
  { key: 'payroll', label: 'Payroll Report', description: 'Payslip summary for a payroll month', hasMonth: true },
]

export default function ReportsPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  async function download(kind: ReportKind) {
    const params = new URLSearchParams({ format: 'csv' })
    if (kind === 'attendance' || kind === 'leave') {
      if (from) params.set('from', from)
      if (to) params.set('to', to)
    }
    if (kind === 'payroll') {
      params.set('month', String(month))
      params.set('year', String(year))
    }

    const token = getToken()
    const res = await fetch(`${API_ORIGIN}/api/reports/${kind}?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${kind}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Reports" />
      <div className="px-8 pb-8 flex flex-col gap-4">
        {reports.map((r) => (
          <div key={r.key} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{r.label}</p>
              <p className="text-xs text-gray-400">{r.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {r.hasDateRange && (
                <>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                  />
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                  />
                </>
              )}
              {r.hasMonth && (
                <>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1).toLocaleString(undefined, { month: 'short' })}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs w-20"
                  />
                </>
              )}
              <button
                onClick={() => download(r.key)}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
              >
                <Icon name="download" size={14} />
                Export CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
