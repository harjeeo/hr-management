import { useEffect, useState, type FormEvent } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { LeaveBalance, LeaveRequest, LeaveType } from '../types/hr'

const isAdmin = (role?: string) => role === 'ORG_ADMIN' || role === 'HR_MANAGER' || role === 'MANAGER'
const canManageTypes = (role?: string) => role === 'ORG_ADMIN' || role === 'HR_MANAGER'

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function LeavePage() {
  const { user } = useAuth()
  const [types, setTypes] = useState<LeaveType[]>([])
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([])
  const [orgRequests, setOrgRequests] = useState<LeaveRequest[]>([])
  const [error, setError] = useState<string | null>(null)

  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeDays, setNewTypeDays] = useState(12)

  const [applyForm, setApplyForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' })

  function loadAll() {
    api.get<LeaveType[]>('/leave/types').then(setTypes)
    api.get<LeaveBalance[]>('/leave/balances/me').then(setBalances).catch(() => setBalances([]))
    api.get<LeaveRequest[]>('/leave/requests/me').then(setMyRequests).catch(() => setMyRequests([]))
    if (isAdmin(user?.role)) {
      api.get<LeaveRequest[]>('/leave/requests?status=PENDING').then(setOrgRequests)
    }
  }

  useEffect(loadAll, [user])

  async function addType(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/leave/types', { name: newTypeName, defaultDaysPerYear: newTypeDays })
      setNewTypeName('')
      loadAll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add leave type')
    }
  }

  async function removeType(id: string) {
    await api.delete(`/leave/types/${id}`)
    loadAll()
  }

  async function applyLeave(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/leave/requests', applyForm)
      setApplyForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' })
      loadAll()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to apply leave')
    }
  }

  async function cancelRequest(id: string) {
    await api.post(`/leave/requests/${id}/cancel`)
    loadAll()
  }

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    await api.put(`/leave/requests/${id}/review`, { status })
    loadAll()
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Leave" />
      <div className="px-8 pb-8 flex flex-col gap-6">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">My Leave Balance</h2>
          <div className="grid grid-cols-4 gap-3">
            {balances.length === 0 && (
              <p className="text-sm text-gray-400 col-span-4">No balance allocated yet.</p>
            )}
            {balances.map((b) => (
              <div key={b.id} className="border border-gray-100 rounded-xl p-3">
                <p className="text-xs text-gray-400">{b.leaveType.name}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {b.allocated - b.used}
                  <span className="text-xs text-gray-400 font-normal"> / {b.allocated} left</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Apply for Leave</h2>
          <form onSubmit={applyLeave} className="border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-3">
            <select
              required
              value={applyForm.leaveTypeId}
              onChange={(e) => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Leave type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Reason (optional)"
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              required
              type="date"
              value={applyForm.startDate}
              onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              required
              type="date"
              value={applyForm.endDate}
              onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <div className="col-span-2 flex justify-end">
              <button className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800">
                Submit
              </button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">My Requests</h2>
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {myRequests.length === 0 && <div className="p-4 text-sm text-gray-400">No leave requests yet.</div>}
            {myRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-gray-900">
                    {r.leaveType.name} · {new Date(r.startDate).toLocaleDateString()} –{' '}
                    {new Date(r.endDate).toLocaleDateString()} ({r.days}d)
                  </p>
                  {r.reason && <p className="text-xs text-gray-400">{r.reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor[r.status]}`}>{r.status}</span>
                  {r.status === 'PENDING' && (
                    <button onClick={() => cancelRequest(r.id)} className="text-gray-400 hover:text-red-500">
                      <Icon name="close" size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isAdmin(user?.role) && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Approvals</h2>
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
              {orgRequests.length === 0 && (
                <div className="p-4 text-sm text-gray-400">No pending leave requests.</div>
              )}
              {orgRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-gray-900">
                      {r.employee?.fullName} · {r.leaveType.name} · {r.days}d
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => review(r.id, 'APPROVED')}
                      className="text-xs font-medium text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => review(r.id, 'REJECTED')}
                      className="text-xs font-medium text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {canManageTypes(user?.role) && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Leave Types</h2>
            <form onSubmit={addType} className="flex items-center gap-2 mb-3">
              <input
                required
                placeholder="Type name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48"
              />
              <input
                type="number"
                min={0}
                value={newTypeDays}
                onChange={(e) => setNewTypeDays(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32"
                placeholder="Days/year"
              />
              <button className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-2 hover:bg-gray-800">
                <Icon name="plus" size={16} />
                Add
              </button>
            </form>
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
              {types.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-900">
                    {t.name} <span className="text-gray-400">· {t.defaultDaysPerYear} days/year</span>
                  </span>
                  <button onClick={() => removeType(t.id)} className="text-gray-400 hover:text-red-500">
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
