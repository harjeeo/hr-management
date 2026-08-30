import { useEffect, useState, type FormEvent } from 'react'
import { Header } from '../components/layout/Header'
import { Avatar } from '../components/ui/Avatar'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Attendance, AttendanceCorrection } from '../types/hr'

function fmtTime(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const isAdmin = (role?: string) => role === 'ORG_ADMIN' || role === 'HR_MANAGER' || role === 'MANAGER'

export default function AttendancePage() {
  const { user } = useAuth()
  const [today, setToday] = useState<Attendance | null>(null)
  const [orgAttendance, setOrgAttendance] = useState<Attendance[]>([])
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCorrectionForm, setShowCorrectionForm] = useState(false)
  const [form, setForm] = useState({ date: '', reason: '', requestedCheckIn: '', requestedCheckOut: '' })

  function loadSelf() {
    api
      .get<Attendance | null>('/attendance/me/today')
      .then(setToday)
      .catch(() => setToday(null))
  }

  function loadAdmin() {
    api.get<Attendance[]>('/attendance').then(setOrgAttendance)
    api.get<AttendanceCorrection[]>('/attendance/corrections?status=PENDING').then(setCorrections)
  }

  useEffect(() => {
    loadSelf()
    if (isAdmin(user?.role)) loadAdmin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleCheckIn() {
    setBusy(true)
    setError(null)
    try {
      await api.post('/attendance/check-in')
      loadSelf()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to check in')
    } finally {
      setBusy(false)
    }
  }

  async function handleCheckOut() {
    setBusy(true)
    setError(null)
    try {
      await api.post('/attendance/check-out')
      loadSelf()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to check out')
    } finally {
      setBusy(false)
    }
  }

  async function handleCorrectionSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/attendance/corrections', {
        date: form.date,
        reason: form.reason,
        requestedCheckIn: form.requestedCheckIn
          ? new Date(`${form.date}T${form.requestedCheckIn}`).toISOString()
          : undefined,
        requestedCheckOut: form.requestedCheckOut
          ? new Date(`${form.date}T${form.requestedCheckOut}`).toISOString()
          : undefined,
      })
      setForm({ date: '', reason: '', requestedCheckIn: '', requestedCheckOut: '' })
      setShowCorrectionForm(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit correction')
    }
  }

  async function reviewCorrection(id: string, status: 'APPROVED' | 'REJECTED') {
    await api.put(`/attendance/corrections/${id}`, { status })
    loadAdmin()
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Attendance" />
      <div className="px-8 pb-8 flex flex-col gap-6">
        <div className="border border-gray-100 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Today · {new Date().toLocaleDateString()}</p>
            <p className="text-sm text-gray-900">
              Check-in: <span className="font-medium">{fmtTime(today?.checkIn)}</span> · Check-out:{' '}
              <span className="font-medium">{fmtTime(today?.checkOut)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckIn}
              disabled={busy || !!today?.checkIn}
              className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800 disabled:opacity-40"
            >
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={busy || !today?.checkIn || !!today?.checkOut}
              className="border border-gray-200 text-gray-700 text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-40"
            >
              Check Out
            </button>
            <button
              onClick={() => setShowCorrectionForm((v) => !v)}
              className="text-sm text-gray-500 hover:text-gray-700 px-2"
            >
              Request correction
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}

        {showCorrectionForm && (
          <form onSubmit={handleCorrectionSubmit} className="border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-3">
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Reason"
              required
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="time"
              value={form.requestedCheckIn}
              onChange={(e) => setForm({ ...form, requestedCheckIn: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Check-in time"
            />
            <input
              type="time"
              value={form.requestedCheckOut}
              onChange={(e) => setForm({ ...form, requestedCheckOut: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Check-out time"
            />
            <div className="col-span-2 flex justify-end">
              <button className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800">
                Submit request
              </button>
            </div>
          </form>
        )}

        {isAdmin(user?.role) && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Today's Attendance</h2>
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                {orgAttendance.length === 0 && (
                  <div className="p-4 text-sm text-gray-400">No attendance recorded today.</div>
                )}
                {orgAttendance.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={a.employee?.fullName ?? '?'} size={28} />
                      <span className="text-sm text-gray-900">{a.employee?.fullName}</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-gray-500">
                      <span>In: {fmtTime(a.checkIn)}</span>
                      <span>Out: {fmtTime(a.checkOut)}</span>
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Pending Corrections</h2>
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                {corrections.length === 0 && (
                  <div className="p-4 text-sm text-gray-400">No pending correction requests.</div>
                )}
                {corrections.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">
                        {c.employee?.fullName} · {new Date(c.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">{c.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => reviewCorrection(c.id, 'APPROVED')}
                        className="text-xs font-medium text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => reviewCorrection(c.id, 'REJECTED')}
                        className="text-xs font-medium text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </div>
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
