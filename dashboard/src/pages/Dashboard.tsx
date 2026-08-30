import { useEffect, useState } from 'react'
import { Header } from '../components/layout/Header'
import { api } from '../lib/api'
import type { Attendance, Employee, Holiday, LeaveBalance } from '../types/hr'
import { useAuth } from '../context/AuthContext'

function fmtTime(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [today, setToday] = useState<Attendance | null>(null)
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])

  useEffect(() => {
    api.get<Employee[]>('/employees').then(setEmployees)
    api.get<Holiday[]>('/holidays').then(setHolidays)
    api
      .get<Attendance | null>('/attendance/me/today')
      .then(setToday)
      .catch(() => setToday(null))
    api.get<LeaveBalance[]>('/leave/balances/me').then(setBalances).catch(() => setBalances([]))
  }, [])

  const active = employees.filter((e) => e.employmentStatus === 'ACTIVE').length
  const onLeave = employees.filter((e) => e.employmentStatus === 'ON_LEAVE').length

  const stats = [
    { label: 'Total Employees', value: employees.length },
    { label: 'Active', value: active },
    { label: 'On Leave', value: onLeave },
    { label: 'Your Role', value: user?.role.replace('_', ' ') ?? '—' },
  ]

  const upcomingHolidays = holidays
    .filter((h) => new Date(h.date) >= new Date(new Date().toDateString()))
    .slice(0, 5)

  const totalLeaveLeft = balances.reduce((sum, b) => sum + (b.allocated - b.used), 0)

  return (
    <div className="flex-1 min-w-0">
      <Header title="Dashboard" />
      <div className="px-8 pb-8 flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-2">Today's Attendance</p>
            <p className="text-sm text-gray-900">
              In: <span className="font-medium">{fmtTime(today?.checkIn)}</span>
            </p>
            <p className="text-sm text-gray-900">
              Out: <span className="font-medium">{fmtTime(today?.checkOut)}</span>
            </p>
          </div>

          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-2">Leave Balance</p>
            <p className="text-2xl font-semibold text-gray-900">{totalLeaveLeft} days left</p>
          </div>

          <div className="border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-2">Upcoming Holidays</p>
            {upcomingHolidays.length === 0 && <p className="text-sm text-gray-400">None scheduled</p>}
            <div className="flex flex-col gap-1">
              {upcomingHolidays.map((h) => (
                <p key={h.id} className="text-sm text-gray-900">
                  {h.name}{' '}
                  <span className="text-gray-400 text-xs">
                    · {new Date(h.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
