export interface NavItem {
  label: string
  path: string
  icon: string
  hasChildren?: boolean
}

export const menuItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Leads', path: '/leads', icon: 'leads' },
  { label: 'Deals', path: '/deals', icon: 'deals', hasChildren: true },
  { label: 'Projects', path: '/projects', icon: 'projects', hasChildren: true },
  { label: 'Contacts', path: '/contacts', icon: 'contacts', hasChildren: true },
  { label: 'Products', path: '/products', icon: 'products' },
  { label: 'Marketplace', path: '/marketplace', icon: 'marketplace' },
]

export const insightItems: NavItem[] = [
  { label: 'Activities', path: '/activities', icon: 'activities' },
  { label: 'Reports', path: '/reports', icon: 'reports', hasChildren: true },
  { label: 'Campaigns', path: '/campaigns', icon: 'campaigns', hasChildren: true },
  { label: 'Inbox', path: '/inbox', icon: 'inbox' },
  { label: 'Tasks', path: '/tasks', icon: 'tasks' },
  { label: 'Calendar', path: '/calendar', icon: 'calendar' },
]
