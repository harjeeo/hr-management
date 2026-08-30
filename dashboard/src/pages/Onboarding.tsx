import { useEffect, useState, type FormEvent } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { api } from '../lib/api'
import type { Employee, OnboardingTask } from '../types/hr'

export default function OnboardingPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [tasks, setTasks] = useState<OnboardingTask[]>([])
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    api.get<Employee[]>('/employees').then((list) => {
      setEmployees(list)
      if (!employeeId && list.length > 0) setEmployeeId(list[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadTasks(id: string) {
    api.get<OnboardingTask[]>(`/onboarding/employees/${id}`).then(setTasks)
  }

  useEffect(() => {
    if (employeeId) loadTasks(employeeId)
  }, [employeeId])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!employeeId || !newTask.trim()) return
    await api.post(`/onboarding/employees/${employeeId}`, { title: newTask })
    setNewTask('')
    loadTasks(employeeId)
  }

  async function toggleTask(task: OnboardingTask) {
    await api.put(`/onboarding/tasks/${task.id}`, { isDone: !task.isDone })
    loadTasks(employeeId)
  }

  async function removeTask(id: string) {
    await api.delete(`/onboarding/tasks/${id}`)
    loadTasks(employeeId)
  }

  const done = tasks.filter((t) => t.isDone).length
  const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="flex-1 min-w-0">
      <Header title="Onboarding" />
      <div className="px-8 pb-8 flex flex-col gap-4">
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64"
        >
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.fullName} ({emp.employeeCode})
            </option>
          ))}
        </select>

        {employeeId && (
          <>
            <div className="border border-gray-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">
                  {done} of {tasks.length} tasks complete
                </p>
                <p className="text-sm font-medium text-gray-900">{progress}%</p>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <form onSubmit={handleAdd} className="flex items-center gap-2">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add checklist item…"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-72"
              />
              <button className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-2 hover:bg-gray-800">
                <Icon name="plus" size={16} />
                Add
              </button>
            </form>

            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
              {tasks.length === 0 && <div className="p-4 text-sm text-gray-400">No checklist items yet.</div>}
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={t.isDone}
                      onChange={() => toggleTask(t)}
                      className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                    />
                    <span className={`text-sm ${t.isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {t.title}
                    </span>
                  </label>
                  <button onClick={() => removeTask(t.id)} className="text-gray-400 hover:text-red-500">
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
