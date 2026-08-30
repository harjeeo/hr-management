import { useEffect, useState, type FormEvent } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { api, ApiError } from '../lib/api'
import type { Candidate, CandidateStage, Department, Designation, JobOpening } from '../types/hr'

const stages: CandidateStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'SHORTLISTED', 'SELECTED', 'REJECTED', 'HIRED']

const stageColor: Record<CandidateStage, string> = {
  APPLIED: 'bg-gray-100 text-gray-600',
  SCREENING: 'bg-sky-50 text-sky-600',
  INTERVIEW: 'bg-violet-50 text-violet-600',
  SHORTLISTED: 'bg-amber-50 text-amber-600',
  SELECTED: 'bg-emerald-50 text-emerald-600',
  REJECTED: 'bg-red-50 text-red-500',
  HIRED: 'bg-emerald-600 text-white',
}

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<JobOpening[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [designations, setDesignations] = useState<Designation[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [showJobForm, setShowJobForm] = useState(false)
  const [showCandidateForm, setShowCandidateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [jobForm, setJobForm] = useState({
    title: '',
    departmentId: '',
    designationId: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
  })
  const [candidateForm, setCandidateForm] = useState({ fullName: '', email: '', phone: '' })

  function loadJobs() {
    api.get<JobOpening[]>('/recruitment/jobs').then(setJobs)
  }

  function loadCandidates(jobOpeningId?: string) {
    api
      .get<Candidate[]>(`/recruitment/candidates${jobOpeningId ? `?jobOpeningId=${jobOpeningId}` : ''}`)
      .then(setCandidates)
  }

  useEffect(() => {
    loadJobs()
    loadCandidates()
    api.get<Department[]>('/departments').then(setDepartments)
    api.get<Designation[]>('/designations').then(setDesignations)
  }, [])

  useEffect(() => {
    loadCandidates(selectedJobId || undefined)
  }, [selectedJobId])

  async function handleAddJob(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/recruitment/jobs', {
        title: jobForm.title,
        departmentId: jobForm.departmentId || undefined,
        designationId: jobForm.designationId || undefined,
        location: jobForm.location || undefined,
        salaryMin: jobForm.salaryMin ? Number(jobForm.salaryMin) : undefined,
        salaryMax: jobForm.salaryMax ? Number(jobForm.salaryMax) : undefined,
      })
      setJobForm({ title: '', departmentId: '', designationId: '', location: '', salaryMin: '', salaryMax: '' })
      setShowJobForm(false)
      loadJobs()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create job opening')
    }
  }

  async function toggleJobStatus(job: JobOpening) {
    await api.put(`/recruitment/jobs/${job.id}`, { status: job.status === 'OPEN' ? 'CLOSED' : 'OPEN' })
    loadJobs()
  }

  async function deleteJob(id: string) {
    await api.delete(`/recruitment/jobs/${id}`)
    loadJobs()
  }

  async function handleAddCandidate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!selectedJobId) {
      setError('Select a job opening first')
      return
    }
    try {
      await api.post('/recruitment/candidates', { ...candidateForm, jobOpeningId: selectedJobId })
      setCandidateForm({ fullName: '', email: '', phone: '' })
      setShowCandidateForm(false)
      loadCandidates(selectedJobId)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add candidate')
    }
  }

  async function changeStage(candidate: Candidate, stage: CandidateStage) {
    if (stage === 'HIRED') {
      const employeeCode = window.prompt(`Employee code for ${candidate.fullName}:`)
      if (!employeeCode) return
      try {
        await api.post(`/recruitment/candidates/${candidate.id}/hire`, { employeeCode })
        loadCandidates(selectedJobId || undefined)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to hire candidate')
      }
      return
    }
    await api.put(`/recruitment/candidates/${candidate.id}`, { stage })
    loadCandidates(selectedJobId || undefined)
  }

  async function deleteCandidate(id: string) {
    await api.delete(`/recruitment/candidates/${id}`)
    loadCandidates(selectedJobId || undefined)
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Recruitment" />
      <div className="px-8 pb-8 flex flex-col gap-6">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-900">Job Openings</h2>
            <button
              onClick={() => setShowJobForm((v) => !v)}
              className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-2 hover:bg-gray-800"
            >
              <Icon name="plus" size={16} />
              New Job
            </button>
          </div>

          {showJobForm && (
            <form onSubmit={handleAddJob} className="border border-gray-100 rounded-xl p-4 mb-3 grid grid-cols-3 gap-3">
              <input
                required
                placeholder="Job title"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={jobForm.departmentId}
                onChange={(e) => setJobForm({ ...jobForm, departmentId: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Department (optional)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <select
                value={jobForm.designationId}
                onChange={(e) => setJobForm({ ...jobForm, designationId: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Designation (optional)</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
              <input
                placeholder="Location"
                value={jobForm.location}
                onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Min salary"
                value={jobForm.salaryMin}
                onChange={(e) => setJobForm({ ...jobForm, salaryMin: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Max salary"
                value={jobForm.salaryMax}
                onChange={(e) => setJobForm({ ...jobForm, salaryMax: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <div className="col-span-3 flex justify-end">
                <button className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800">
                  Create Job
                </button>
              </div>
            </form>
          )}

          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {jobs.length === 0 && <div className="p-4 text-sm text-gray-400">No job openings yet.</div>}
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJobId(job.id === selectedJobId ? '' : job.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50/60 ${
                  selectedJobId === job.id ? 'bg-gray-50' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{job.title}</p>
                  <p className="text-xs text-gray-400">
                    {job.department?.name ?? '—'} · {job.designation?.title ?? '—'} · {job.location ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{job._count?.candidates ?? 0} candidates</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {job.status}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleJobStatus(job)
                    }}
                    className="text-xs text-gray-500 hover:text-gray-900 cursor-pointer"
                  >
                    {job.status === 'OPEN' ? 'Close' : 'Reopen'}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteJob(job.id)
                    }}
                    className="text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    <Icon name="delete" size={16} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-900">
              Candidates {selectedJobId && jobs.find((j) => j.id === selectedJobId) ? `· ${jobs.find((j) => j.id === selectedJobId)?.title}` : ''}
            </h2>
            <button
              onClick={() => setShowCandidateForm((v) => !v)}
              className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-2 hover:bg-gray-800"
            >
              <Icon name="plus" size={16} />
              Add Candidate
            </button>
          </div>

          {showCandidateForm && (
            <form
              onSubmit={handleAddCandidate}
              className="border border-gray-100 rounded-xl p-4 mb-3 grid grid-cols-3 gap-3"
            >
              <select
                required
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select job opening</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
              <input
                required
                placeholder="Full name"
                value={candidateForm.fullName}
                onChange={(e) => setCandidateForm({ ...candidateForm, fullName: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={candidateForm.email}
                onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="Phone"
                value={candidateForm.phone}
                onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <div className="col-span-3 flex justify-end">
                <button className="bg-gray-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-gray-800">
                  Add Candidate
                </button>
              </div>
            </form>
          )}

          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            {candidates.length === 0 && <div className="p-4 text-sm text-gray-400">No candidates yet.</div>}
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={c.fullName} size={32} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.fullName}</p>
                    <p className="text-xs text-gray-400">
                      {c.email} · {c.jobOpening?.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={c.stage}
                    onChange={(e) => changeStage(c, e.target.value as CandidateStage)}
                    className={`text-xs px-2 py-1.5 rounded-full border-0 font-medium ${stageColor[c.stage]}`}
                  >
                    {stages.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => deleteCandidate(c.id)} className="text-gray-400 hover:text-red-500">
                    <Icon name="delete" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
