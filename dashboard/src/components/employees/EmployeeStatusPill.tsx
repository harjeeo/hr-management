import type { Employee } from '../../types/hr'

const styles: Record<Employee['employmentStatus'], string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-600',
  ON_LEAVE: 'bg-amber-50 text-amber-600',
  PROBATION: 'bg-blue-50 text-blue-600',
  RESIGNED: 'bg-gray-100 text-gray-500',
  TERMINATED: 'bg-red-50 text-red-500',
  RETIRED: 'bg-gray-100 text-gray-500',
}

const labels: Record<Employee['employmentStatus'], string> = {
  ACTIVE: 'Active',
  ON_LEAVE: 'On Leave',
  PROBATION: 'Probation',
  RESIGNED: 'Resigned',
  TERMINATED: 'Terminated',
  RETIRED: 'Retired',
}

export function EmployeeStatusPill({ status }: { status: Employee['employmentStatus'] }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
