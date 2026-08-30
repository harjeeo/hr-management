import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import DashboardPage from './pages/Dashboard'
import EmployeesPage from './pages/Employees'
import BranchesPage from './pages/Branches'
import DepartmentsPage from './pages/Departments'
import DesignationsPage from './pages/Designations'
import AttendancePage from './pages/Attendance'
import LeavePage from './pages/Leave'
import HolidaysPage from './pages/Holidays'
import DocumentsPage from './pages/Documents'
import PayrollPage from './pages/Payroll'
import PayslipDetailPage from './pages/PayslipDetail'
import ReportsPage from './pages/Reports'
import SuperAdminOrganizationsPage from './pages/SuperAdminOrganizations'
import PlaceholderPage from './pages/Placeholder'
import { useAuth } from './context/AuthContext'

const comingSoon = [
  { path: '/recruitment', label: 'Recruitment' },
  { path: '/announcements', label: 'Announcements' },
  { path: '/settings', label: 'Settings' },
]

function AppShell() {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/branches" element={<BranchesPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/designations" element={<DesignationsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/leave" element={<LeavePage />} />
        <Route path="/holidays" element={<HolidaysPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/payroll/payslips/:id" element={<PayslipDetailPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/super-admin/organizations" element={<SuperAdminOrganizationsPage />} />
        {comingSoon.map((item) => (
          <Route key={item.path} path={item.path} element={<PlaceholderPage title={item.label} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<AppShell />} />
      </Route>
    </Routes>
  )
}

export default App
