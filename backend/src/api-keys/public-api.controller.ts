import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeyGuard } from './api-key.guard';
import { ApiOrganizationId } from './api-org.decorator';

@UseGuards(ApiKeyGuard)
@Controller('public-api/v1')
export class PublicApiController {
  constructor(private prisma: PrismaService) {}

  @Get('employees')
  async listEmployees(@ApiOrganizationId() organizationId: string) {
    return this.prisma.employee.findMany({
      where: { organizationId },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        employmentStatus: true,
        employmentType: true,
        joiningDate: true,
        department: { select: { name: true } },
        designation: { select: { title: true } },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  @Get('attendance/today')
  async todayAttendance(@ApiOrganizationId() organizationId: string) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return this.prisma.attendance.findMany({
      where: { organizationId, date },
      select: {
        employee: { select: { employeeCode: true, fullName: true } },
        status: true,
        checkIn: true,
        checkOut: true,
      },
    });
  }
}
