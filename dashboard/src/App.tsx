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
import RecruitmentPage from './pages/Recruitment'
import OnboardingPage from './pages/Onboarding'
import PerformancePage from './pages/Performance'
import SubscriptionPage from './pages/Subscription'
import SuperAdminOrganizationsPage from './pages/SuperAdminOrganizations'
import SuperAdminBillingPage from './pages/SuperAdminBilling'
import SettingsPage from './pages/Settings'
import PlaceholderPage from './pages/Placeholder'
import { useAuth } from './context/AuthContext'

const comingSoon = [{ path: '/announcements', label: 'Announcements' }]

function AppShell() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <Routes>
        <Route
          path="/"
          element={
            isSuperAdmin ? <Navigate to="/super-admin/organizations" replace /> : <DashboardPage />
          }
        />
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
        <Route path="/recruitment" element={<RecruitmentPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/super-admin/organizations" element={<SuperAdminOrganizationsPage />} />
        <Route path="/super-admin/billing" element={<SuperAdminBillingPage />} />
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
