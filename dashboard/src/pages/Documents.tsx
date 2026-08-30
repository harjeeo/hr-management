import { useEffect, useState, type FormEvent } from 'react'
import { Header } from '../components/layout/Header'
import { Icon } from '../components/ui/Icon'
import { api, ApiError, API_ORIGIN } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { DocumentCategory, Employee, EmployeeDocument } from '../types/hr'

const isAdmin = (role?: string) => role === 'ORG_ADMIN' || role === 'HR_MANAGER'

const categories: DocumentCategory[] = [
  'ID_PROOF',
  'PAN',
  'PASSPORT',
  'DRIVING_LICENSE',
  'EDUCATION_CERTIFICATE',
  'EXPERIENCE_LETTER',
  'OFFER_LETTER',
  'APPOINTMENT_LETTER',
  'EMPLOYMENT_AGREEMENT',
  'SALARY_DOCUMENT',
  'OTHER',
]

export default function DocumentsPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [docs, setDocs] = useState<EmployeeDocument[]>([])
  const [category, setCategory] = useState<DocumentCategory>('OTHER')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (isAdmin(user?.role)) {
      api.get<Employee[]>('/employees').then((list) => {
        setEmployees(list)
        if (!employeeId && list.length > 0) setEmployeeId(list[0].id)
      })
    } else {
      api
        .get<{ id: string }>('/employees/me')
        .then((me) => setEmployeeId(me.id))
        .catch(() => setError('No employee profile linked to your account'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (!employeeId) return
    api.get<EmployeeDocument[]>(`/documents?employeeId=${employeeId}`).then(setDocs)
  }, [employeeId])

  async function handleUpload(e: FormEvent) {
    e.preventDefault()
    if (!file || !employeeId) return
    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('employeeId', employeeId)
      formData.append('category', category)
      formData.append('file', file)
      await api.upload('/documents', formData)
      setFile(null)
      api.get<EmployeeDocument[]>(`/documents?employeeId=${employeeId}`).then(setDocs)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/documents/${id}`)
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="flex-1 min-w-0">
      <Header title="Documents" />
      <div className="px-8 pb-8">
        {isAdmin(user?.role) && (
          <div className="mb-4">
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-64"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleUpload} className="flex items-center gap-2 mb-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <button
            disabled={!file || uploading}
            className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg px-3 py-2 hover:bg-gray-800 disabled:opacity-40"
          >
            <Icon name="plus" size={16} />
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </form>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
          {docs.length === 0 && <div className="p-4 text-sm text-gray-400">No documents uploaded yet.</div>}
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-4 py-3">
              <a
                href={`${API_ORIGIN}${d.fileUrl}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-gray-900 hover:underline"
              >
                <Icon name="download" size={16} className="text-gray-400" />
                {d.fileName}
              </a>
              <div className="flex items-center gap-4">
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  {d.category.replace(/_/g, ' ')}
                </span>
                <button onClick={() => handleDelete(d.id)} className="text-gray-400 hover:text-red-500">
                  <Icon name="delete" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
