import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Header } from '../components/layout/Header'
import { api } from '../lib/api'
import type { Payslip } from '../types/hr'

function currency(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
}

export default function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [payslip, setPayslip] = useState<Payslip | null>(null)

  useEffect(() => {
    if (id) api.get<Payslip>(`/payroll/payslips/${id}`).then(setPayslip)
  }, [id])

  if (!payslip) {
    return (
      <div className="flex-1 min-w-0">
        <Header title="Payslip" />
        <div className="px-8 pb-8 text-sm text-gray-400">Loading…</div>
      </div>
    )
  }

  const earnings: [string, number][] = [
    ['Basic', payslip.basic],
    ['HRA', payslip.hra],
    ['Conveyance', payslip.conveyance],
    ['Special Allowance', payslip.specialAllowance],
    ['Other Allowance', payslip.otherAllowance],
  ]
  const deductions: [string, number][] = [
    ['Provident Fund', payslip.providentFund],
    ['Professional Tax', payslip.professionalTax],
    ['Other Deductions', payslip.otherDeductions],
  ]

  return (
    <div className="flex-1 min-w-0">
      <Header title="Payslip" />
      <div className="px-8 pb-8">
        <div className="flex justify-end mb-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800"
          >
            Print / Save as PDF
          </button>
        </div>

        <div className="border border-gray-100 rounded-xl p-6 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {payslip.employee?.fullName ?? 'Payslip'}
              </h2>
              <p className="text-sm text-gray-500">{payslip.employee?.employeeCode}</p>
            </div>
            {payslip.payrollRun && (
              <p className="text-sm text-gray-500">
                {new Date(2000, payslip.payrollRun.month - 1).toLocaleString(undefined, { month: 'long' })}{' '}
                {payslip.payrollRun.year}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Earnings</h3>
              {earnings.map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="text-gray-900">{currency(value)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm py-1 border-t border-gray-100 mt-2 pt-2 font-medium">
                <span>Gross Salary</span>
                <span>{currency(payslip.grossSalary)}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Deductions</h3>
              {deductions.map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="text-gray-900">{currency(value)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm py-1 border-t border-gray-100 mt-2 pt-2 font-medium">
                <span>Total Deductions</span>
                <span>{currency(payslip.totalDeductions)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <span className="text-base font-semibold text-gray-900">Net Salary</span>
            <span className="text-xl font-bold text-gray-900">{currency(payslip.netSalary)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
