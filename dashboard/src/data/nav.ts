export interface NavItem {
  label: string
  path: string
  icon: string
  hasChildren?: boolean
}

export const menuItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Employees', path: '/employees', icon: 'contacts' },
  { label: 'Branches', path: '/branches', icon: 'marketplace' },
  { label: 'Departments', path: '/departments', icon: 'projects' },
  { label: 'Designations', path: '/designations', icon: 'tag' },
  { label: 'Attendance', path: '/attendance', icon: 'clock' },
  { label: 'Leave', path: '/leave', icon: 'calendar' },
  { label: 'Payroll', path: '/payroll', icon: 'deals' },
  { label: 'Recruitment', path: '/recruitment', icon: 'leads' },
  { label: 'Documents', path: '/documents', icon: 'inbox' },
]

export const insightItems: NavItem[] = [
  { label: 'Reports', path: '/reports', icon: 'reports' },
  { label: 'Announcements', path: '/announcements', icon: 'activities' },
  { label: 'Settings', path: '/settings', icon: 'tasks' },
]

export const superAdminItems: NavItem[] = [
  { label: 'Organizations', path: '/super-admin/organizations', icon: 'marketplace' },
]
