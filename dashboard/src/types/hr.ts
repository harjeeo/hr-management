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
