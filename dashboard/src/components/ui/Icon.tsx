import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardSquare01Icon,
  CheckmarkCircle02Icon,
  Wallet01Icon,
  Folder01Icon,
  Contact01Icon,
  Package01Icon,
  Store01Icon,
  Activity01Icon,
  BarChartIcon,
  Megaphone01Icon,
  InboxIcon,
  Task01Icon,
  Calendar03Icon,
  Search01Icon,
  Notification03Icon,
  PlusSignIcon,
  FilterHorizontalIcon,
  Download04Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  SidebarLeftIcon,
  PhoneCallIcon,
  Clock01Icon,
  Edit02Icon,
  Delete02Icon,
  ListViewIcon,
  Grid02Icon,
  Cancel01Icon,
  MailAtSign01Icon,
  Tag01Icon,
  UserGroupIcon,
  UserCheck01Icon,
  Airplane01Icon,
  ShieldUserIcon,
  LoginCircle01Icon,
  LogoutCircle01Icon,
  Building06Icon,
} from '@hugeicons/core-free-icons'

export const iconMap = {
  dashboard: DashboardSquare01Icon,
  leads: CheckmarkCircle02Icon,
  deals: Wallet01Icon,
  projects: Folder01Icon,
  contacts: Contact01Icon,
  products: Package01Icon,
  marketplace: Store01Icon,
  activities: Activity01Icon,
  reports: BarChartIcon,
  campaigns: Megaphone01Icon,
  inbox: InboxIcon,
  tasks: Task01Icon,
  calendar: Calendar03Icon,
  search: Search01Icon,
  notification: Notification03Icon,
  plus: PlusSignIcon,
  filter: FilterHorizontalIcon,
  download: Download04Icon,
  chevronDown: ChevronDownIcon,
  chevronUp: ChevronUpIcon,
  sidebar: SidebarLeftIcon,
  phone: PhoneCallIcon,
  clock: Clock01Icon,
  edit: Edit02Icon,
  delete: Delete02Icon,
  list: ListViewIcon,
  grid: Grid02Icon,
  close: Cancel01Icon,
  mail: MailAtSign01Icon,
  tag: Tag01Icon,
  users: UserGroupIcon,
  userCheck: UserCheck01Icon,
  airplane: Airplane01Icon,
  shield: ShieldUserIcon,
  checkIn: LoginCircle01Icon,
  checkOut: LogoutCircle01Icon,
  building: Building06Icon,
} as const

export type IconName = keyof typeof iconMap

interface IconProps {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}

export function Icon({ name, size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <HugeiconsIcon icon={iconMap[name]} size={size} className={className} strokeWidth={strokeWidth} />
  )
}
