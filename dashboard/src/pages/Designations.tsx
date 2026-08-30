import { useEffect, useState, type FormEvent } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { api, ApiError } from '../lib/api'
import type { Designation } from '../types/hr'

export default function DesignationsPage() {
  const [items, setItems] = useState<Designation[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api
      .get<Designation[]>('/designations')
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/designations', { title })
      setTitle('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add designation')
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/designations/${id}`)
    load()
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Designations" />
      <div className="px-8 pb-8">
        <form onSubmit={handleAdd} className="flex items-center gap-2 mb-4">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New designation title"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
          <button className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-2 hover:bg-gray-800">
            <Icon name="plus" size={16} />
            Add
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </form>

        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
          {loading && <div className="p-4 text-sm text-gray-400">Loading…</div>}
          {!loading && items.length === 0 && (
            <div className="p-4 text-sm text-gray-400">No designations yet.</div>
          )}
          {items.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-900">{d.title}</span>
              <button
                onClick={() => handleDelete(d.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Icon name="delete" size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
