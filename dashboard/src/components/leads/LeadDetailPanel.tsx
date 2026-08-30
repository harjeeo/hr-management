import type { Lead, LeadStatus } from '../../data/leads'
import { Avatar } from '../ui/Avatar'
import { Icon, type IconName } from '../ui/Icon'
import { StatusPill } from './StatusPill'

const statusOptions: LeadStatus[] = ['Cold Lead', 'Warm Lead', 'Hot Lead']

interface DetailRowProps {
  icon: IconName
  label: string
  value: string
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        <Icon name={icon} size={15} className="text-gray-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

interface LeadDetailPanelProps {
  lead: Lead
  onClose: () => void
  onStatusChange: (id: string, status: LeadStatus) => void
}

export function LeadDetailPanel({ lead, onClose, onStatusChange }: LeadDetailPanelProps) {
  return (
    <aside className="w-[360px] shrink-0 h-screen sticky top-0 border-l border-gray-100 bg-white overflow-y-auto">
      <div className="flex items-start justify-between px-5 pt-5">
        <div className="flex items-center gap-3">
          <Avatar name={lead.name} size={44} />
          <div>
            <h2 className="text-base font-semibold text-gray-900">{lead.name}</h2>
            <p className="text-xs text-gray-400">Lead since {lead.createdAgo}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="px-5 pt-5">
        <StatusPill status={lead.status} />
      </div>

      <div className="px-5 mt-4">
        <DetailRow icon="edit" label="Subject" value={lead.subject} />
        <DetailRow icon="phone" label="Phone" value={lead.phone} />
        <DetailRow icon="mail" label="Email" value={lead.email} />
        <DetailRow icon="tag" label="Source" value={lead.source} />
        <DetailRow icon="clock" label="Last Activity" value={lead.activityDate} />
      </div>

      <div className="px-5 mt-5">
        <label className="text-xs text-gray-400 mb-1.5 block">Status</label>
        <select
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="px-5 mt-5 pb-6 flex flex-col gap-2.5">
        <button className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100">
          <Icon name="phone" size={16} />
          Call Lead
        </button>
        <button className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50">
          <Icon name="mail" size={16} />
          Send Email
        </button>
        <button className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100">
          <Icon name="delete" size={16} />
          Delete Lead
        </button>
      </div>
    </aside>
  )
}
