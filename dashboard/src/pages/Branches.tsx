import { useEffect, useState, type FormEvent } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { api, ApiError } from '../lib/api'
import type { Branch } from '../types/hr'

export default function BranchesPage() {
  const [items, setItems] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    api
      .get<Branch[]>('/branches')
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/branches', { name, city: city || undefined })
      setName('')
      setCity('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add branch')
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/branches/${id}`)
    load()
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Branches" />
      <div className="px-8 pb-8">
        <form onSubmit={handleAdd} className="flex items-center gap-2 mb-4">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Branch name"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (optional)"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
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
            <div className="p-4 text-sm text-gray-400">No branches yet.</div>
          )}
          {items.map((b) => (
            <div key={b.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-900">
                {b.name}
                {b.city && <span className="text-gray-400"> · {b.city}</span>}
              </span>
              <button onClick={() => handleDelete(b.id)} className="text-gray-400 hover:text-red-500">
                <Icon name="delete" size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
