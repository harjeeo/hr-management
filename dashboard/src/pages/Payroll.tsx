import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Employee, PayrollRun, Payslip, SalaryStructure } from '../types/hr'

const isAdmin = (role?: string) => role === 'ORG_ADMIN' || role === 'HR_MANAGER'

const emptyStructure: SalaryStructure = {
  basic: 0,
  hra: 0,
  conveyance: 0,
  specialAllowance: 0,
  otherAllowance: 0,
  providentFund: 0,
  professionalTax: 0,
  otherDeductions: 0,
}

function currency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

export default function PayrollPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [structure, setStructure] = useState<SalaryStructure>(emptyStructure)
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [myPayslips, setMyPayslips] = useState<Payslip[]>([])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .get<Payslip[]>('/payroll/payslips/me')
      .then(setMyPayslips)
      .catch(() => setMyPayslips([]))

    if (isAdmin(user?.role)) {
      api.get<Employee[]>('/employees').then((list) => {
        setEmployees(list)
        if (!employeeId && list.length > 0) setEmployeeId(list[0].id)
      })
      api.get<PayrollRun[]>('/payroll/runs').then(setRuns)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!employeeId) return
    api
      .get<SalaryStructure | null>(`/payroll/salary-structures/${employeeId}`)
      .then((s) => setStructure(s ?? emptyStructure))
  }, [employeeId])

  async function saveStructure(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.put(`/payroll/salary-structures/${employeeId}`, structure)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save salary structure')
    }
  }

  async function runPayroll() {
    setBusy(true)
    setError(null)
    try {
      await api.post('/payroll/runs', { month, year })
      api.get<PayrollRun[]>('/payroll/runs').then(setRuns)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to process payroll')
    } finally {
      setBusy(false)
    }
  }

  const gross =
    structure.basic + structure.hra + structure.conveyance + structure.specialAllowance + structure.otherAllowance
  const deductions = structure.providentFund + structure.professionalTax + structure.otherDeductions

  return (
    <div className="flex-1 min-w-0">
      <Header title="Payroll" />
      <div className="px-8 pb-8 flex flex-col gap-6">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">My Payslips</h2>
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {myPayslips.length === 0 && <div className="p-4 text-sm text-gray-400">No payslips yet.</div>}
            {myPayslips.map((p) => (
              <Link
                key={p.id}
                to={`/payroll/payslips/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <span className="text-sm text-gray-900">
                  {p.payrollRun?.month}/{p.payrollRun?.year}
                </span>
                <span className="text-sm font-medium text-gray-900">{currency(p.netSalary)}</span>
              </Link>
            ))}
          </div>
        </div>

        {isAdmin(user?.role) && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Salary Structure</h2>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 mb-3"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
              <form onSubmit={saveStructure} className="border border-gray-100 rounded-xl p-4 grid grid-cols-4 gap-3">
                {(
                  [
                    ['basic', 'Basic'],
                    ['hra', 'HRA'],
                    ['conveyance', 'Conveyance'],
                    ['specialAllowance', 'Special Allowance'],
                    ['otherAllowance', 'Other Allowance'],
                    ['providentFund', 'Provident Fund'],
                    ['professionalTax', 'Professional Tax'],
                    ['otherDeductions', 'Other Deductions'],
                  ] as [keyof SalaryStructure, string][]
                ).map(([key, label]) => (
                  <label key={key} className="text-xs text-gray-500">
                    {label}
                    <input
                      type="number"
                      min={0}
                      value={structure[key]}
                      onChange={(e) => setStructure({ ...structure, [key]: Number(e.target.value) })}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    />
                  </label>
                ))}
                <div className="col-span-4 flex items-center justify-between pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Gross: <span className="font-medium text-gray-900">{currency(gross)}</span> · Deductions:{' '}
                    <span className="font-medium text-gray-900">{currency(deductions)}</span> · Net:{' '}
                    <span className="font-medium text-gray-900">{currency(gross - deductions)}</span>
                  </p>
                  <button className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800">
                    Save
                  </button>
                </div>
              </form>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Run Payroll</h2>
              <div className="flex items-center gap-2">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1).toLocaleString(undefined, { month: 'long' })}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24"
                />
                <button
                  onClick={runPayroll}
                  disabled={busy}
                  className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800 disabled:opacity-40"
                >
                  <Icon name="plus" size={16} />
                  {busy ? 'Processing…' : 'Process Payroll'}
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Payroll History</h2>
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                {runs.length === 0 && <div className="p-4 text-sm text-gray-400">No payroll runs yet.</div>}
                {runs.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-gray-900">
                      {new Date(2000, r.month - 1).toLocaleString(undefined, { month: 'long' })} {r.year}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
