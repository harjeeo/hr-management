import { useEffect, useState, type FormEvent } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { api, ApiError } from '../lib/api'
import type { BillingCycle, Plan, Subscription } from '../types/hr'

function currency(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const emptyForm = { name: '', price: '', billingCycle: 'MONTHLY' as BillingCycle, employeeLimit: '', features: '' }

export default function SuperAdminBillingPage() {
  const [stats, setStats] = useState<{ mrr: number; arr: number; activeSubscriptions: number } | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  function load() {
    api.get<{ mrr: number; arr: number; activeSubscriptions: number }>('/super-admin/billing-stats').then(setStats)
    api.get<Plan[]>('/super-admin/plans').then(setPlans)
    api.get<Subscription[]>('/super-admin/subscriptions').then(setSubscriptions)
  }

  useEffect(load, [])

  async function handleCreatePlan(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/super-admin/plans', {
        name: form.name,
        price: Number(form.price),
        billingCycle: form.billingCycle,
        employeeLimit: Number(form.employeeLimit),
        features: form.features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
      })
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create plan')
    }
  }

  async function togglePlanActive(plan: Plan) {
    await api.put(`/super-admin/plans/${plan.id}`, { isActive: !plan.isActive })
    load()
  }

  async function markPaid(invoiceId: string) {
    await api.post(`/super-admin/invoices/${invoiceId}/mark-paid`)
    load()
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Plans & Billing" />
      <div className="px-8 pb-8 flex flex-col gap-6">
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">MRR</p>
              <p className="text-2xl font-semibold text-gray-900">{currency(stats.mrr)}</p>
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">ARR</p>
              <p className="text-2xl font-semibold text-gray-900">{currency(stats.arr)}</p>
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Active Subscriptions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeSubscriptions}</p>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-900">Plans</h2>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-2 hover:bg-gray-800"
            >
              <Icon name="plus" size={16} />
              New Plan
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreatePlan} className="border border-gray-100 rounded-xl p-4 grid grid-cols-4 gap-3 mb-3">
              <input
                required
                placeholder="Plan name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                required
                type="number"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={form.billingCycle}
                onChange={(e) => setForm({ ...form, billingCycle: e.target.value as BillingCycle })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
              <input
                required
                type="number"
                placeholder="Employee limit"
                value={form.employeeLimit}
                onChange={(e) => setForm({ ...form, employeeLimit: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Features (comma separated)"
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                className="col-span-4 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <div className="col-span-4 flex justify-end">
                <button className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800">
                  Create Plan
                </button>
              </div>
            </form>
          )}

          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{plan.name}</p>
                  <p className="text-xs text-gray-400">
                    {currency(plan.price)}/{plan.billingCycle === 'YEARLY' ? 'year' : 'month'} · up to{' '}
                    {plan.employeeLimit} employees
                  </p>
                </div>
                <button
                  onClick={() => togglePlanActive(plan)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    plan.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {plan.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Organization Subscriptions</h2>
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {subscriptions.length === 0 && <div className="p-4 text-sm text-gray-400">No subscriptions yet.</div>}
            {subscriptions.map((sub) => (
              <div key={sub.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sub.organization?.name}</p>
                    <p className="text-xs text-gray-400">
                      {sub.plan.name} · {sub.status}
                    </p>
                  </div>
                  {sub.invoices
                    ?.filter((inv) => inv.status === 'PENDING')
                    .map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => markPaid(inv.id)}
                        className="text-xs font-medium text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50"
                      >
                        Mark {currency(inv.amount)} Paid
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
