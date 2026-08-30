import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { BranchesModule } from './branches/branches.module';
import { DepartmentsModule } from './departments/departments.module';
import { DesignationsModule } from './designations/designations.module';
import { EmployeesModule } from './employees/employees.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeaveModule } from './leave/leave.module';
import { HolidaysModule } from './holidays/holidays.module';
import { DocumentsModule } from './documents/documents.module';
import { PayrollModule } from './payroll/payroll.module';
import { ReportsModule } from './reports/reports.module';
import { BillingModule } from './billing/billing.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { PerformanceModule } from './performance/performance.module';
import { AuditModule } from './audit/audit.module';
import { ApiKeysModule } from './api-keys/api-keys.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    BranchesModule,
    DepartmentsModule,
    DesignationsModule,
    EmployeesModule,
    SuperAdminModule,
    NotificationsModule,
    AttendanceModule,
    LeaveModule,
    HolidaysModule,
    DocumentsModule,
    PayrollModule,
    ReportsModule,
    BillingModule,
    RecruitmentModule,
    OnboardingModule,
    PerformanceModule,
    AuditModule,
    ApiKeysModule,
  ],
})
export class AppModule {}
