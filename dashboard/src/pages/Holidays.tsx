import { useEffect, useState, type FormEvent } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Holiday, HolidayType } from '../types/hr'

const canManage = (role?: string) => role === 'ORG_ADMIN' || role === 'HR_MANAGER'

const typeColor: Record<HolidayType, string> = {
  PUBLIC: 'bg-sky-100 text-sky-700',
  FESTIVAL: 'bg-violet-100 text-violet-700',
  COMPANY: 'bg-emerald-100 text-emerald-700',
  OPTIONAL: 'bg-amber-100 text-amber-700',
}

export default function HolidaysPage() {
  const { user } = useAuth()
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState<HolidayType>('PUBLIC')
  const [error, setError] = useState<string | null>(null)

  function load() {
    api.get<Holiday[]>('/holidays').then(setHolidays)
  }

  useEffect(load, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/holidays', { name, date, type })
      setName('')
      setDate('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add holiday')
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/holidays/${id}`)
    load()
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Holidays" />
      <div className="px-8 pb-8">
        {canManage(user?.role) && (
          <form onSubmit={handleAdd} className="flex items-center gap-2 mb-4">
            <input
              required
              placeholder="Holiday name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56"
            />
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as HolidayType)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="PUBLIC">Public</option>
              <option value="FESTIVAL">Festival</option>
              <option value="COMPANY">Company</option>
              <option value="OPTIONAL">Optional</option>
            </select>
            <button className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-2 hover:bg-gray-800">
              <Icon name="plus" size={16} />
              Add
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </form>
        )}

        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
          {holidays.length === 0 && <div className="p-4 text-sm text-gray-400">No holidays added yet.</div>}
          {holidays.map((h) => (
            <div key={h.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-900">{h.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${typeColor[h.type]}`}>{h.type}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">
                  {new Date(h.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                {canManage(user?.role) && (
                  <button onClick={() => handleDelete(h.id)} className="text-gray-400 hover:text-red-500">
                    <Icon name="delete" size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
