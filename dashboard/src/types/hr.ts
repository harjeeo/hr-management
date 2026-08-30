export type Role = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'HR_MANAGER' | 'MANAGER' | 'EMPLOYEE'

export interface AuthUser {
  userId: string
  email: string
  role: Role
  organizationId: string | null
}

export interface Organization {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  industry?: string | null
  companySize?: string | null
  timezone: string
  currency: string
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED'
}

export interface Branch {
  id: string
  name: string
  address?: string | null
  city?: string | null
}

export interface Department {
  id: string
  name: string
}

export interface Designation {
  id: string
  title: string
}

export interface Employee {
  id: string
  employeeCode: string
  fullName: string
  email: string
  phone?: string | null
  joiningDate?: string | null
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'RESIGNED' | 'TERMINATED' | 'RETIRED'
  branch?: Branch | null
  department?: Department | null
  designation?: Designation | null
  manager?: { id: string; fullName: string } | null
}

export interface EmployeeRef {
  id: string
  fullName: string
  employeeCode: string
}

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'WORK_FROM_HOME'
  | 'HOLIDAY'
  | 'WEEKLY_OFF'
  | 'ON_LEAVE'

export interface Attendance {
  id: string
  date: string
  checkIn?: string | null
  checkOut?: string | null
  status: AttendanceStatus
  notes?: string | null
  employee?: EmployeeRef
}

export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AttendanceCorrection {
  id: string
  date: string
  requestedCheckIn?: string | null
  requestedCheckOut?: string | null
  reason: string
  status: CorrectionStatus
  reviewNote?: string | null
  employee?: EmployeeRef
}

export interface LeaveType {
  id: string
  name: string
  isPaid: boolean
  defaultDaysPerYear: number
}

export interface LeaveBalance {
  id: string
  year: number
  allocated: number
  used: number
  leaveType: LeaveType
}

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface LeaveRequest {
  id: string
  startDate: string
  endDate: string
  days: number
  reason?: string | null
  status: LeaveRequestStatus
  reviewNote?: string | null
  leaveType: LeaveType
  employee?: EmployeeRef
}

export type HolidayType = 'PUBLIC' | 'FESTIVAL' | 'COMPANY' | 'OPTIONAL'

export interface Holiday {
  id: string
  name: string
  date: string
  type: HolidayType
}

export type DocumentCategory =
  | 'ID_PROOF'
  | 'PAN'
  | 'PASSPORT'
  | 'DRIVING_LICENSE'
  | 'EDUCATION_CERTIFICATE'
  | 'EXPERIENCE_LETTER'
  | 'OFFER_LETTER'
  | 'APPOINTMENT_LETTER'
  | 'EMPLOYMENT_AGREEMENT'
  | 'SALARY_DOCUMENT'
  | 'OTHER'

export interface EmployeeDocument {
  id: string
  category: DocumentCategory
  fileName: string
  fileUrl: string
  expiryDate?: string | null
  createdAt: string
}

export interface AppNotification {
  id: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface SalaryStructure {
  id?: string
  basic: number
  hra: number
  conveyance: number
  specialAllowance: number
  otherAllowance: number
  providentFund: number
  professionalTax: number
  otherDeductions: number
}

export type PayrollRunStatus = 'DRAFT' | 'PROCESSED' | 'PAID'

export interface PayrollRun {
  id: string
  month: number
  year: number
  status: PayrollRunStatus
  processedAt?: string | null
}

export interface Payslip {
  id: string
  basic: number
  hra: number
  conveyance: number
  specialAllowance: number
  otherAllowance: number
  grossSalary: number
  providentFund: number
  professionalTax: number
  otherDeductions: number
  totalDeductions: number
  netSalary: number
  createdAt: string
  employee?: EmployeeRef
  payrollRun?: { month: number; year: number; status: PayrollRunStatus }
}

export interface PayrollRunDetail extends PayrollRun {
  payslips: Payslip[]
}
