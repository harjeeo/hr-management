import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
