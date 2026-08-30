import { useEffect, useState } from 'react'
import { Header } from '../components/layout/Header'
import { api } from '../lib/api'

interface OrgRow {
  id: string
  name: string
  slug: string
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED'
  createdAt: string
  _count: { employees: number; users: number }
}

export default function SuperAdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    api
      .get<OrgRow[]>('/super-admin/organizations')
      .then(setOrgs)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function toggleStatus(org: OrgRow) {
    const status = org.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    await api.put(`/super-admin/organizations/${org.id}/status`, { status })
    load()
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Organizations" />
      <div className="px-8 pb-8">
        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
          {loading && <div className="p-4 text-sm text-gray-400">Loading…</div>}
          {!loading && orgs.length === 0 && (
            <div className="p-4 text-sm text-gray-400">No organizations yet.</div>
          )}
          {orgs.map((org) => (
            <div key={org.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{org.name}</p>
                <p className="text-xs text-gray-400">
                  {org.slug} · {org._count.employees} employees · {org._count.users} users
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    org.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : org.status === 'SUSPENDED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {org.status}
                </span>
                <button
                  onClick={() => toggleStatus(org)}
                  className="text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
                >
                  {org.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
