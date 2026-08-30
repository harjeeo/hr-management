import { useEffect, useState, type FormEvent } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { api, ApiError } from '../lib/api'
import type { Branch, Department, Designation, Employee } from '../types/hr'

const emptyForm = {
  employeeCode: '',
  fullName: '',
  email: '',
  phone: '',
  branchId: '',
  departmentId: '',
  designationId: '',
  joiningDate: '',
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  function loadEmployees(q?: string) {
    setLoading(true)
    api
      .get<Employee[]>(`/employees${q ? `?search=${encodeURIComponent(q)}` : ''}`)
      .then(setEmployees)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadEmployees()
    api.get<Branch[]>('/branches').then(setBranches)
    api.get<Department[]>('/departments').then(setDepartments)
    api.get<Designation[]>('/designations').then(setDesignations)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => loadEmployees(search), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/employees', {
        employeeCode: form.employeeCode,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        branchId: form.branchId || undefined,
        departmentId: form.departmentId || undefined,
        designationId: form.designationId || undefined,
        joiningDate: form.joiningDate || undefined,
      })
      setForm(emptyForm)
      setShowForm(false)
      loadEmployees(search)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add employee')
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/employees/${id}`)
    loadEmployees(search)
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Employees" />
      <div className="px-8 pb-8">
        <div className="flex items-center justify-between mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-2 hover:bg-gray-800"
          >
            <Icon name="plus" size={16} />
            Add Employee
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="border border-gray-100 rounded-xl p-4 mb-4 grid grid-cols-2 gap-3"
          >
            <input
              required
              placeholder="Employee code"
              value={form.employeeCode}
              onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Branch (optional)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Department (optional)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={form.designationId}
              onChange={(e) => setForm({ ...form, designationId: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Designation (optional)</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.joiningDate}
              onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            {error && <p className="text-sm text-red-600 col-span-2">{error}</p>}
            <div className="col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 px-3 py-2"
              >
                Cancel
              </button>
              <button className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800">
                Save Employee
              </button>
            </div>
          </form>
        )}

        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
          {loading && <div className="p-4 text-sm text-gray-400">Loading…</div>}
          {!loading && employees.length === 0 && (
            <div className="p-4 text-sm text-gray-400">No employees yet.</div>
          )}
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={emp.fullName} size={32} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{emp.fullName}</p>
                  <p className="text-xs text-gray-400">
                    {emp.employeeCode} · {emp.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-xs text-gray-500">
                <span>{emp.department?.name ?? '—'}</span>
                <span>{emp.designation?.title ?? '—'}</span>
                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  {emp.employmentStatus.replace('_', ' ')}
                </span>
                <button onClick={() => handleDelete(emp.id)} className="text-gray-400 hover:text-red-500">
                  <Icon name="delete" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
