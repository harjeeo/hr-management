import { useEffect, useState } from 'react'
import { Header } from '../components/layout/Header'
import { api } from '../lib/api'
import type { Attendance, Employee, Holiday, LeaveBalance } from '../types/hr'
import { useAuth } from '../context/AuthContext'

const isAdmin = (role?: string) => role === 'ORG_ADMIN' || role === 'HR_MANAGER'

function fmtTime(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function currency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

const barColors = ['bg-sky-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500']

export default function DashboardPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [today, setToday] = useState<Attendance | null>(null)
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [payrollTotal, setPayrollTotal] = useState<number | null>(null)

  useEffect(() => {
    api.get<Employee[]>('/employees').then(setEmployees)
    api.get<Holiday[]>('/holidays').then(setHolidays)
    api
      .get<Attendance | null>('/attendance/me/today')
      .then(setToday)
      .catch(() => setToday(null))
    api.get<LeaveBalance[]>('/leave/balances/me').then(setBalances).catch(() => setBalances([]))

    if (isAdmin(user?.role)) {
      const now = new Date()
      api
        .get<{ netSalary: number }[]>(
          `/reports/payroll?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
        )
        .then((rows) => setPayrollTotal(rows.reduce((sum, r) => sum + r.netSalary, 0)))
        .catch(() => setPayrollTotal(null))
    }
  }, [user])

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

  const deptCounts = new Map<string, number>()
  employees.forEach((e) => {
    const name = e.department?.name ?? 'Unassigned'
    deptCounts.set(name, (deptCounts.get(name) ?? 0) + 1)
  })
  const deptDistribution = [...deptCounts.entries()].sort((a, b) => b[1] - a[1])
  const maxDeptCount = Math.max(1, ...deptDistribution.map(([, c]) => c))

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

        {isAdmin(user?.role) && (
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-gray-100 rounded-xl p-4 col-span-2">
              <p className="text-xs text-gray-400 mb-3">Employees by Department</p>
              {deptDistribution.length === 0 && <p className="text-sm text-gray-400">No employees yet</p>}
              <div className="flex flex-col gap-2">
                {deptDistribution.map(([name, count], i) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-28 truncate">{name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColors[i % barColors.length]}`}
                        style={{ width: `${(count / maxDeptCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-2">This Month's Payroll</p>
              <p className="text-2xl font-semibold text-gray-900">
                {payrollTotal === null ? 'Not processed' : currency(payrollTotal)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
