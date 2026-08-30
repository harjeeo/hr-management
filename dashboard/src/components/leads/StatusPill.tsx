import type { LeadStatus } from '../../data/leads'

const styles: Record<LeadStatus, string> = {
  'Cold Lead': 'bg-blue-50 text-blue-600',
  'Warm Lead': 'bg-amber-50 text-amber-600',
  'Hot Lead': 'bg-red-50 text-red-500',
}

export function StatusPill({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  )
}
