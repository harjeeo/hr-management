import { useEffect, useState, type FormEvent } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { ApiKeyCreated, ApiKeySummary, AuditLogEntry } from '../types/hr'

const isAdmin = (role?: string) => role === 'ORG_ADMIN' || role === 'HR_MANAGER'

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null)

  function loadMe() {
    api
      .get<{ twoFactorEnabled: boolean }>('/auth/me')
      .then((me) => setTwoFactorEnabled(me.twoFactorEnabled))
  }

  useEffect(() => {
    loadMe()
    if (isAdmin(user?.role)) {
      api.get<AuditLogEntry[]>('/audit-logs').then(setAuditLogs)
      api.get<ApiKeySummary[]>('/api-keys').then(setApiKeys)
    }
  }, [user])

  async function startSetup() {
    setError(null)
    try {
      const data = await api.post<{ secret: string; qrCodeDataUrl: string }>('/auth/2fa/setup')
      setSetupData(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to start 2FA setup')
    }
  }

  async function enableTwoFactor(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      await api.post('/auth/2fa/enable', { code })
      setSetupData(null)
      setCode('')
      setSuccess('Two-factor authentication enabled')
      loadMe()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid code')
    }
  }

  async function disableTwoFactor(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      await api.post('/auth/2fa/disable', { code })
      setCode('')
      setSuccess('Two-factor authentication disabled')
      loadMe()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid code')
    }
  }

  async function createApiKey(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const key = await api.post<ApiKeyCreated>('/api-keys', { name: newKeyName })
      setCreatedKey(key)
      setNewKeyName('')
      api.get<ApiKeySummary[]>('/api-keys').then(setApiKeys)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create API key')
    }
  }

  async function revokeKey(id: string) {
    await api.delete(`/api-keys/${id}`)
    api.get<ApiKeySummary[]>('/api-keys').then(setApiKeys)
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Settings" />
      <div className="px-8 pb-8 flex flex-col gap-6">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Two-Factor Authentication</h2>
          <div className="border border-gray-100 rounded-xl p-4">
            {twoFactorEnabled ? (
              <>
                <p className="text-sm text-gray-700 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                    <Icon name="shield" size={16} /> Enabled
                  </span>{' '}
                  — your account is protected with an authenticator app.
                </p>
                <form onSubmit={disableTwoFactor} className="flex items-center gap-2">
                  <input
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter code to disable"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48"
                  />
                  <button className="text-sm font-medium text-red-600 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50">
                    Disable 2FA
                  </button>
                </form>
              </>
            ) : setupData ? (
              <form onSubmit={enableTwoFactor} className="flex flex-col gap-3">
                <p className="text-sm text-gray-700">
                  Scan this QR code with Google Authenticator, Authy, or a similar app, then enter the 6-digit
                  code to confirm.
                </p>
                <img src={setupData.qrCodeDataUrl} alt="2FA QR code" className="w-40 h-40" />
                <p className="text-xs text-gray-400">
                  Or enter this key manually: <code className="font-mono">{setupData.secret}</code>
                </p>
                <div className="flex items-center gap-2">
                  <input
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="000000"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32 text-center tracking-widest"
                  />
                  <button className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800">
                    Confirm & Enable
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-3">
                  Add an extra layer of security to your account with an authenticator app.
                </p>
                <button
                  onClick={startSetup}
                  className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800"
                >
                  Set up 2FA
                </button>
              </>
            )}
          </div>
        </div>

        {isAdmin(user?.role) && (
          <>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">API Keys</h2>
              <form onSubmit={createApiKey} className="flex items-center gap-2 mb-3">
                <input
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. Zapier integration)"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64"
                />
                <button className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-2 hover:bg-gray-800">
                  <Icon name="plus" size={16} />
                  Generate Key
                </button>
              </form>

              {createdKey && (
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 mb-3">
                  <p className="text-sm text-amber-800 mb-1">
                    Copy this key now — it won't be shown again.
                  </p>
                  <code className="text-xs font-mono break-all">{createdKey.key}</code>
                </div>
              )}

              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                {apiKeys.length === 0 && <div className="p-4 text-sm text-gray-400">No API keys yet.</div>}
                {apiKeys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">{k.name}</p>
                      <p className="text-xs text-gray-400 font-mono">
                        {k.keyPrefix}… · {k.lastUsedAt ? `used ${timeAgo(k.lastUsedAt)}` : 'never used'}
                      </p>
                    </div>
                    {k.revokedAt ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">Revoked</span>
                    ) : (
                      <button
                        onClick={() => revokeKey(k.id)}
                        className="text-xs font-medium text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Audit Log</h2>
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {auditLogs.length === 0 && <div className="p-4 text-sm text-gray-400">No activity recorded yet.</div>}
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">{log.description}</p>
                      <p className="text-xs text-gray-400">
                        {log.user?.name ?? 'System'} · {log.action} · {log.ipAddress ?? ''}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(log.createdAt)}</span>
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
