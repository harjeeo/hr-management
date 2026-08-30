import { useEffect, useState } from 'react'
import { Header } from '../components/layout/Header'
import { EmployeesTable } from '../components/employees/EmployeesTable'
import { EmployeesToolbar } from '../components/employees/EmployeesToolbar'
import { EmployeeDetailPanel, type EmployeeFormData } from '../components/employees/EmployeeDetailPanel'
import { Pagination } from '../components/leads/Pagination'
import { api, API_ORIGIN, getToken } from '../lib/api'
import type { Branch, Department, Designation, Employee } from '../types/hr'

const PAGE_SIZE = 11

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)

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
    const t = setTimeout(() => {
      setPage(1)
      loadEmployees(search)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE))
  const pageItems = employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selectedEmployee = employees.find((e) => e.id === selectedId) ?? null

  function openView(emp: Employee) {
    setSelectedId(emp.id)
    setIsNew(false)
    setPanelOpen(true)
  }

  function openCreate() {
    setSelectedId(null)
    setIsNew(true)
    setPanelOpen(true)
  }

  function closePanel() {
    setPanelOpen(false)
    setSelectedId(null)
    setIsNew(false)
  }

  async function handleSave(data: EmployeeFormData) {
    const payload = {
      employeeCode: data.employeeCode,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || undefined,
      branchId: data.branchId || undefined,
      departmentId: data.departmentId || undefined,
      designationId: data.designationId || undefined,
      joiningDate: data.joiningDate || undefined,
      employmentType: data.employmentType,
      employmentStatus: data.employmentStatus,
    }

    if (isNew) {
      const created = await api.post<Employee>('/employees', payload)
      loadEmployees(search)
      setSelectedId(created.id)
      setIsNew(false)
    } else if (selectedEmployee) {
      await api.put(`/employees/${selectedEmployee.id}`, payload)
      loadEmployees(search)
    }
  }

  async function handleStatusChange(status: Employee['employmentStatus']) {
    if (!selectedEmployee) return
    await api.put(`/employees/${selectedEmployee.id}`, { employmentStatus: status })
    loadEmployees(search)
  }

  async function handleDelete(emp: Employee) {
    await api.delete(`/employees/${emp.id}`)
    if (selectedId === emp.id) closePanel()
    loadEmployees(search)
  }

  async function handleExport() {
    const token = getToken()
    const res = await fetch(`${API_ORIGIN}/api/reports/employees?format=csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employees.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 min-w-0 flex">
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
            <EmployeesToolbar onExport={handleExport} onAddNew={openCreate} />
          </div>

          <div className="border border-gray-100 rounded-xl">
            {loading ? (
              <div className="p-6 text-sm text-gray-400">Loading…</div>
            ) : pageItems.length === 0 ? (
              <div className="p-6 text-sm text-gray-400">No employees yet.</div>
            ) : (
              <EmployeesTable
                employees={pageItems}
                selectedId={selectedId ?? undefined}
                onRowClick={openView}
                onEdit={openView}
                onDelete={handleDelete}
              />
            )}
          </div>

          {employees.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Show</span>
                <select className="border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700">
                  <option>{PAGE_SIZE}</option>
                </select>
                <span>Employees per page</span>
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {panelOpen && (
        <EmployeeDetailPanel
          employee={selectedEmployee}
          isNew={isNew}
          branches={branches}
          departments={departments}
          designations={designations}
          onClose={closePanel}
          onSave={handleSave}
          onStatusChange={handleStatusChange}
          onDelete={() => selectedEmployee && handleDelete(selectedEmployee)}
        />
      )}
    </div>
  )
}
