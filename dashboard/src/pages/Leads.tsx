import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { LeadsToolbar } from '../components/leads/LeadsToolbar'
import { LeadsTable } from '../components/leads/LeadsTable'
import { LeadDetailPanel } from '../components/leads/LeadDetailPanel'
import { Pagination } from '../components/leads/Pagination'
import { leads as initialLeads, type Lead, type LeadStatus } from '../data/leads'

const PAGE_SIZE = 11
const TOTAL_PAGES = 16

export default function LeadsPage() {
  const [page, setPage] = useState(1)
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null

  function handleStatusChange(id: string, status: LeadStatus) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
  }

  return (
    <div className="flex-1 min-w-0 flex">
      <div className="flex-1 min-w-0">
        <Header title="Leads" />
        <div className="px-8 pb-8">
          <LeadsToolbar />
          <div className="border border-gray-100 rounded-xl">
            <LeadsTable leads={leads} selectedId={selectedId ?? undefined} onRowClick={(lead) => setSelectedId(lead.id)} />
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Show</span>
              <select className="border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700">
                <option>{PAGE_SIZE}</option>
              </select>
              <span>Leads per page</span>
            </div>
            <Pagination currentPage={page} totalPages={TOTAL_PAGES} onPageChange={setPage} />
          </div>
        </div>
      </div>

      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedId(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
