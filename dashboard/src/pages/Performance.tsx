import { useEffect, useState, type FormEvent } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Employee, Goal, PerformanceCycle, PerformanceReview } from '../types/hr'

const isAdmin = (role?: string) => role === 'ORG_ADMIN' || role === 'HR_MANAGER'
const canAssign = (role?: string) => role === 'ORG_ADMIN' || role === 'HR_MANAGER' || role === 'MANAGER'

export default function PerformancePage() {
  const { user } = useAuth()
  const [cycles, setCycles] = useState<PerformanceCycle[]>([])
  const [cycleId, setCycleId] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [myGoals, setMyGoals] = useState<Goal[]>([])
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [myReview, setMyReview] = useState<PerformanceReview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [showCycleForm, setShowCycleForm] = useState(false)
  const [cycleForm, setCycleForm] = useState({ name: '', startDate: '', endDate: '' })

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalForm, setGoalForm] = useState({ employeeId: '', title: '', description: '' })

  const [selfForm, setSelfForm] = useState({ selfRating: 3, selfFeedback: '' })

  function loadCycles() {
    api.get<PerformanceCycle[]>('/performance/cycles').then((list) => {
      setCycles(list)
      if (!cycleId && list.length > 0) setCycleId(list[0].id)
    })
  }

  useEffect(() => {
    loadCycles()
    api.get<Employee[]>('/employees').then(setEmployees)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!cycleId) return
    api
      .get<Goal[]>(`/performance/cycles/${cycleId}/goals/me`)
      .then(setMyGoals)
      .catch(() => setMyGoals([]))
    api
      .get<PerformanceReview | null>(`/performance/cycles/${cycleId}/reviews/me`)
      .then((r) => {
        setMyReview(r)
        if (r) setSelfForm({ selfRating: r.selfRating ?? 3, selfFeedback: r.selfFeedback ?? '' })
      })
      .catch(() => setMyReview(null))

    if (isAdmin(user?.role)) {
      api.get<Goal[]>(`/performance/cycles/${cycleId}/goals`).then(setGoals)
      api.get<PerformanceReview[]>(`/performance/cycles/${cycleId}/reviews`).then(setReviews)
    }
  }, [cycleId, user])

  async function handleCreateCycle(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/performance/cycles', cycleForm)
      setCycleForm({ name: '', startDate: '', endDate: '' })
      setShowCycleForm(false)
      loadCycles()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create cycle')
    }
  }

  async function handleAddGoal(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post(`/performance/cycles/${cycleId}/goals`, goalForm)
      setGoalForm({ employeeId: '', title: '', description: '' })
      setShowGoalForm(false)
      api.get<Goal[]>(`/performance/cycles/${cycleId}/goals`).then(setGoals)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add goal')
    }
  }

  async function updateGoalStatus(goal: Goal, status: Goal['status']) {
    await api.put(`/performance/goals/${goal.id}`, { status })
    if (isAdmin(user?.role)) api.get<Goal[]>(`/performance/cycles/${cycleId}/goals`).then(setGoals)
    api.get<Goal[]>(`/performance/cycles/${cycleId}/goals/me`).then(setMyGoals).catch(() => {})
  }

  async function submitSelfReview(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const r = await api.post<PerformanceReview>(`/performance/cycles/${cycleId}/reviews/self`, selfForm)
      setMyReview(r)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit review')
    }
  }

  async function submitManagerReview(employeeId: string, managerRating: number, managerFeedback: string) {
    await api.post(`/performance/cycles/${cycleId}/reviews/${employeeId}/manager`, {
      managerRating,
      managerFeedback,
      finalRating: managerRating,
    })
    api.get<PerformanceReview[]>(`/performance/cycles/${cycleId}/reviews`).then(setReviews)
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Performance" />
      <div className="px-8 pb-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <select
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64"
          >
            {cycles.length === 0 && <option value="">No cycles yet</option>}
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.status})
              </option>
            ))}
          </select>
          {isAdmin(user?.role) && (
            <button
              onClick={() => setShowCycleForm((v) => !v)}
              className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-2 hover:bg-gray-800"
            >
              <Icon name="plus" size={16} />
              New Cycle
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {showCycleForm && (
          <form onSubmit={handleCreateCycle} className="border border-gray-100 rounded-xl p-4 grid grid-cols-3 gap-3">
            <input
              required
              placeholder="Cycle name (e.g. Q1 2026)"
              value={cycleForm.name}
              onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              required
              type="date"
              value={cycleForm.startDate}
              onChange={(e) => setCycleForm({ ...cycleForm, startDate: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <input
              required
              type="date"
              value={cycleForm.endDate}
              onChange={(e) => setCycleForm({ ...cycleForm, endDate: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <div className="col-span-3 flex justify-end">
              <button className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800">
                Create Cycle
              </button>
            </div>
          </form>
        )}

        {cycleId && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">My Goals</h2>
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                {myGoals.length === 0 && <div className="p-4 text-sm text-gray-400">No goals assigned yet.</div>}
                {myGoals.map((g) => (
                  <div key={g.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">{g.title}</p>
                      {g.description && <p className="text-xs text-gray-400">{g.description}</p>}
                    </div>
                    <select
                      value={g.status}
                      onChange={(e) => updateGoalStatus(g, e.target.value as Goal['status'])}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Self Assessment</h2>
              <form onSubmit={submitSelfReview} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                <label className="text-xs text-gray-400">
                  Self Rating (1-5)
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={selfForm.selfRating}
                    onChange={(e) => setSelfForm({ ...selfForm, selfRating: Number(e.target.value) })}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                  />
                </label>
                <label className="text-xs text-gray-400">
                  Feedback
                  <textarea
                    value={selfForm.selfFeedback}
                    onChange={(e) => setSelfForm({ ...selfForm, selfFeedback: e.target.value })}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
                    rows={3}
                  />
                </label>
                <div className="flex justify-end">
                  <button className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800">
                    {myReview?.selfRating ? 'Update Self Review' : 'Submit Self Review'}
                  </button>
                </div>
              </form>
            </div>

            {canAssign(user?.role) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-900">Team Goals</h2>
                  <button
                    onClick={() => setShowGoalForm((v) => !v)}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
                  >
                    <Icon name="plus" size={14} />
                    Assign Goal
                  </button>
                </div>

                {showGoalForm && (
                  <form onSubmit={handleAddGoal} className="border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-3 mb-3">
                    <select
                      required
                      value={goalForm.employeeId}
                      onChange={(e) => setGoalForm({ ...goalForm, employeeId: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      placeholder="Goal title"
                      value={goalForm.title}
                      onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={goalForm.description}
                      onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                      className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      rows={2}
                    />
                    <div className="col-span-2 flex justify-end">
                      <button className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800">
                        Assign
                      </button>
                    </div>
                  </form>
                )}

                <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {goals.length === 0 && <div className="p-4 text-sm text-gray-400">No goals assigned yet.</div>}
                  {goals.map((g) => (
                    <div key={g.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">
                          {g.employee?.fullName} · {g.title}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {g.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAdmin(user?.role) && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Reviews</h2>
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                  {reviews.length === 0 && <div className="p-4 text-sm text-gray-400">No reviews yet.</div>}
                  {reviews.map((r) => (
                    <ManagerReviewRow key={r.id} review={r} onSubmit={submitManagerReview} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ManagerReviewRow({
  review,
  onSubmit,
}: {
  review: PerformanceReview
  onSubmit: (employeeId: string, rating: number, feedback: string) => void
}) {
  const [rating, setRating] = useState(review.managerRating ?? 3)
  const [feedback, setFeedback] = useState(review.managerFeedback ?? '')

  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <div className="min-w-0">
        <p className="text-sm text-gray-900">{review.employee?.fullName}</p>
        <p className="text-xs text-gray-400">
          Self: {review.selfRating ?? '—'}/5 {review.selfFeedback && `· "${review.selfFeedback}"`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-14 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
        />
        <input
          placeholder="Manager feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-48 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
        />
        <button
          onClick={() => review.employee && onSubmit(review.employee.id, rating, feedback)}
          className="text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
        >
          Save
        </button>
      </div>
    </div>
  )
}
