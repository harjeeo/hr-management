import { useEffect, useState } from 'react'
import { Header } from '../components/layout/Header'
import { api } from '../lib/api'
import type { Employee } from '../types/hr'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    api.get<Employee[]>('/employees').then(setEmployees)
  }, [])

  const active = employees.filter((e) => e.employmentStatus === 'ACTIVE').length
  const onLeave = employees.filter((e) => e.employmentStatus === 'ON_LEAVE').length

  const stats = [
    { label: 'Total Employees', value: employees.length },
    { label: 'Active', value: active },
    { label: 'On Leave', value: onLeave },
    { label: 'Your Role', value: user?.role.replace('_', ' ') ?? '—' },
  ]

  return (
    <div className="flex-1 min-w-0">
      <Header title="Dashboard" />
      <div className="px-8 pb-8">
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
