import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, clearToken, setToken } from '../lib/api'
import type { AuthUser } from '../types/hr'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  registerOrg: (companyName: string, ownerName: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<{ id: string; email: string; name: string; role: AuthUser['role']; organizationId: string | null }>(
        '/auth/me',
      )
      .then((me) =>
        setUser({ userId: me.id, email: me.email, role: me.role, organizationId: me.organizationId }),
      )
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post<LoginResponse>('/auth/login', { email, password })
    setToken(res.accessToken)
    setUser(res.user)
  }

  async function registerOrg(companyName: string, ownerName: string, email: string, password: string) {
    const res = await api.post<LoginResponse>('/auth/register-organization', {
      companyName,
      ownerName,
      email,
      password,
    })
    setToken(res.accessToken)
    setUser(res.user)
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, registerOrg, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
