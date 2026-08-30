import { useEffect, useState, type FormEvent } from 'react'
import type { Branch, Department, Designation, Employee } from '../../types/hr'
import { Avatar } from '../ui/Avatar'
import { Icon, type IconName } from '../ui/Icon'
import { EmployeeStatusPill } from './EmployeeStatusPill'
import { ApiError } from '../../lib/api'

const statusOptions: Employee['employmentStatus'][] = [
  'ACTIVE',
  'ON_LEAVE',
  'PROBATION',
  'RESIGNED',
  'TERMINATED',
  'RETIRED',
]

const typeOptions: Employee['employmentType'][] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']

export interface EmployeeFormData {
  employeeCode: string
  fullName: string
  email: string
  phone: string
  branchId: string
  departmentId: string
  designationId: string
  joiningDate: string
  employmentType: Employee['employmentType']
  employmentStatus: Employee['employmentStatus']
}

function toFormData(emp: Employee | null): EmployeeFormData {
  return {
    employeeCode: emp?.employeeCode ?? '',
    fullName: emp?.fullName ?? '',
    email: emp?.email ?? '',
    phone: emp?.phone ?? '',
    branchId: emp?.branch?.id ?? '',
    departmentId: emp?.department?.id ?? '',
    designationId: emp?.designation?.id ?? '',
    joiningDate: emp?.joiningDate?.slice(0, 10) ?? '',
    employmentType: emp?.employmentType ?? 'FULL_TIME',
    employmentStatus: emp?.employmentStatus ?? 'ACTIVE',
  }
}

interface DetailRowProps {
  icon: IconName
  label: string
  value: string
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        <Icon name={icon} size={15} className="text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900'
const labelCls = 'text-xs text-gray-400 mb-1 block'

interface EmployeeDetailPanelProps {
  employee: Employee | null
  isNew: boolean
  branches: Branch[]
  departments: Department[]
  designations: Designation[]
  onClose: () => void
  onSave: (data: EmployeeFormData) => Promise<void>
  onStatusChange: (status: Employee['employmentStatus']) => Promise<void>
  onDelete: () => void
}

export function EmployeeDetailPanel({
  employee,
  isNew,
  branches,
  departments,
  designations,
  onClose,
  onSave,
  onStatusChange,
  onDelete,
}: EmployeeDetailPanelProps) {
  const [editing, setEditing] = useState(isNew)
  const [form, setForm] = useState<EmployeeFormData>(toFormData(employee))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(toFormData(employee))
    setEditing(isNew)
    setError(null)
  }, [employee, isNew])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSave(form)
      setEditing(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save employee')
    } finally {
      setSaving(false)
    }
  }

  const title = isNew ? 'New Employee' : employee?.fullName ?? ''

  return (
    <aside className="w-[380px] shrink-0 h-screen sticky top-0 border-l border-gray-100 bg-white overflow-y-auto">
      <div className="flex items-start justify-between px-5 pt-5">
        <div className="flex items-center gap-3">
          <Avatar name={title || '?'} size={44} />
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title || 'New Employee'}</h2>
            {employee && <p className="text-xs text-gray-400">{employee.employeeCode}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      {employee && !editing && (
        <div className="px-5 pt-5">
          <EmployeeStatusPill status={employee.employmentStatus} />
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} className="px-5 mt-5 flex flex-col gap-3">
          <label>
            <span className={labelCls}>Employee code</span>
            <input
              required
              value={form.employeeCode}
              onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
              className={inputCls}
            />
          </label>
          <label>
            <span className={labelCls}>Full name</span>
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={inputCls}
            />
          </label>
          <label>
            <span className={labelCls}>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
            />
          </label>
          <label>
            <span className={labelCls}>Phone</span>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputCls}
            />
          </label>
          <label>
            <span className={labelCls}>Branch</span>
            <select
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              className={inputCls}
            >
              <option value="">—</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelCls}>Department</span>
            <select
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              className={inputCls}
            >
              <option value="">—</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelCls}>Designation</span>
            <select
              value={form.designationId}
              onChange={(e) => setForm({ ...form, designationId: e.target.value })}
              className={inputCls}
            >
              <option value="">—</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelCls}>Joining date</span>
            <input
              type="date"
              value={form.joiningDate}
              onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
              className={inputCls}
            />
          </label>
          <label>
            <span className={labelCls}>Employment type</span>
            <select
              value={form.employmentType}
              onChange={(e) => setForm({ ...form, employmentType: e.target.value as EmployeeFormData['employmentType'] })}
              className={inputCls}
            >
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-2 mt-1 pb-2">
            {!isNew && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              disabled={saving}
              className="flex-1 px-3 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isNew ? 'Create Employee' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        employee && (
          <>
            <div className="px-5 mt-4">
              <DetailRow icon="tag" label="Designation" value={employee.designation?.title ?? ''} />
              <DetailRow icon="projects" label="Department" value={employee.department?.name ?? ''} />
              <DetailRow icon="marketplace" label="Branch" value={employee.branch?.name ?? ''} />
              <DetailRow icon="mail" label="Email" value={employee.email} />
              <DetailRow icon="phone" label="Phone" value={employee.phone ?? ''} />
              <DetailRow
                icon="clock"
                label="Joining Date"
                value={employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : ''}
              />
            </div>

            <div className="px-5 mt-5">
              <label className="text-xs text-gray-400 mb-1.5 block">Status</label>
              <select
                value={employee.employmentStatus}
                onChange={(e) => onStatusChange(e.target.value as Employee['employmentStatus'])}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-5 mt-5 pb-6 flex flex-col gap-2.5">
              {employee.phone && (
                <a
                  href={`tel:${employee.phone}`}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100"
                >
                  <Icon name="phone" size={16} />
                  Call Employee
                </a>
              )}
              <a
                href={`mailto:${employee.email}`}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                <Icon name="mail" size={16} />
                Send Email
              </a>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                <Icon name="edit" size={16} />
                Edit Employee
              </button>
              <button
                onClick={onDelete}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100"
              >
                <Icon name="delete" size={16} />
                Delete Employee
              </button>
            </div>
          </>
        )
      )}
    </aside>
  )
}
