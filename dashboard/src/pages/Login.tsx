import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [needs2FA, setNeeds2FA] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await login(email, password, needs2FA ? totpCode : undefined)
      if (res.requires2FA) {
        setNeeds2FA(true)
        return
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <span className="text-white text-sm font-bold">H</span>
          </div>
          <span className="font-semibold text-gray-900 text-[15px]">HR Management</span>
        </div>

        {!needs2FA ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500 mb-6">Sign in to your organization workspace</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Two-Factor Authentication</h1>
            <p className="text-sm text-gray-500 mb-6">Enter the 6-digit code from your authenticator app</p>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!needs2FA ? (
            <>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm text-gray-700 mb-1.5">Authentication code</label>
              <input
                required
                autoFocus
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                placeholder="000000"
              />
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-900 text-white text-sm font-medium rounded-lg py-2.5 hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : needs2FA ? 'Verify' : 'Sign in'}
          </button>
        </form>

        {!needs2FA && (
          <p className="text-sm text-gray-500 mt-6 text-center">
            Don't have an organization?{' '}
            <Link to="/register" className="text-gray-900 font-medium hover:underline">
              Register your company
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
