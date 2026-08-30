import { useEffect, useState } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { api, ApiError } from '../lib/api'
import type { Plan, Subscription } from '../types/hr'

const statusColor: Record<string, string> = {
  TRIAL: 'bg-amber-50 text-amber-600',
  ACTIVE: 'bg-emerald-50 text-emerald-600',
  PAST_DUE: 'bg-red-50 text-red-500',
  CANCELED: 'bg-gray-100 text-gray-500',
}

function currency(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  function load() {
    api.get<Subscription>('/subscriptions/me').then(setSubscription)
    api.get<Plan[]>('/plans').then(setPlans)
  }

  useEffect(load, [])

  async function changePlan(planId: string) {
    setBusy(planId)
    setError(null)
    try {
      await api.post('/subscriptions/me/change-plan', { planId })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change plan')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Subscription" />
      <div className="px-8 pb-8 flex flex-col gap-6">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {subscription && (
          <div className="border border-gray-100 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Current Plan</p>
                <p className="text-xl font-semibold text-gray-900">{subscription.plan.name}</p>
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusColor[subscription.status]}`}>
                {subscription.status.replace('_', ' ')}
              </span>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              {subscription.plan.employeeLimit} employees limit · {currency(subscription.plan.price)}/
              {subscription.plan.billingCycle === 'YEARLY' ? 'year' : 'month'}
            </div>
            {subscription.trialEndsAt && subscription.status === 'TRIAL' && (
              <p className="text-xs text-amber-600 mt-2">
                Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Available Plans</h2>
          <div className="grid grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isCurrent = subscription?.plan.id === plan.id
              return (
                <div key={plan.id} className="border border-gray-100 rounded-xl p-4 flex flex-col">
                  <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{currency(plan.price)}</p>
                  <p className="text-xs text-gray-400 mb-3">
                    /{plan.billingCycle === 'YEARLY' ? 'year' : 'month'} · up to {plan.employeeLimit} employees
                  </p>
                  <ul className="text-xs text-gray-500 flex flex-col gap-1 mb-4 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <Icon name="leads" size={12} className="text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={isCurrent || busy === plan.id}
                    onClick={() => changePlan(plan.id)}
                    className={`text-sm font-medium rounded-lg px-3 py-2 ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : busy === plan.id ? 'Switching…' : 'Switch to this plan'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {subscription?.invoices && subscription.invoices.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Invoices</h2>
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
              {subscription.invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-900">{new Date(inv.issuedAt).toLocaleDateString()}</span>
                  <span className="text-sm text-gray-500">{currency(inv.amount)}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-600'
                        : inv.status === 'FAILED'
                          ? 'bg-red-50 text-red-500'
                          : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
