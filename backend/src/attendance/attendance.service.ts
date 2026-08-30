import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInOutDto, RequestCorrectionDto, ReviewCorrectionDto } from './dto/attendance.dto';
import { NotificationsService } from '../notifications/notifications.service';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private async myEmployee(userId: string) {
    const employee = await this.prisma.employee.findFirst({ where: { userId } });
    if (!employee) throw new BadRequestException('No employee profile linked to this account');
    return employee;
  }

  async checkIn(userId: string, dto: CheckInOutDto) {
    const employee = await this.myEmployee(userId);
    const date = startOfToday();
    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date } },
    });
    if (existing?.checkIn) throw new BadRequestException('Already checked in today');

    return this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: employee.id, date } },
      create: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        date,
        checkIn: new Date(),
        checkInLat: dto.lat,
        checkInLng: dto.lng,
        status: 'PRESENT',
      },
      update: { checkIn: new Date(), checkInLat: dto.lat, checkInLng: dto.lng, status: 'PRESENT' },
    });
  }

  async checkOut(userId: string, dto: CheckInOutDto) {
    const employee = await this.myEmployee(userId);
    const date = startOfToday();
    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date } },
    });
    if (!existing?.checkIn) throw new BadRequestException('You have not checked in today');
    if (existing.checkOut) throw new BadRequestException('Already checked out today');

    return this.prisma.attendance.update({
      where: { id: existing.id },
      data: { checkOut: new Date(), checkOutLat: dto.lat, checkOutLng: dto.lng },
    });
  }

  async myToday(userId: string) {
    const employee = await this.myEmployee(userId);
    const date = startOfToday();
    return this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date } },
    });
  }

  async myHistory(userId: string) {
    const employee = await this.myEmployee(userId);
    return this.prisma.attendance.findMany({
      where: { employeeId: employee.id },
      orderBy: { date: 'desc' },
      take: 60,
    });
  }

  async orgAttendance(organizationId: string, date?: string) {
    const day = date ? new Date(date) : startOfToday();
    day.setHours(0, 0, 0, 0);
    return this.prisma.attendance.findMany({
      where: { organizationId, date: day },
      include: { employee: { select: { id: true, fullName: true, employeeCode: true } } },
      orderBy: { employee: { fullName: 'asc' } },
    });
  }

  async requestCorrection(userId: string, dto: RequestCorrectionDto) {
    const employee = await this.myEmployee(userId);
    const date = new Date(dto.date);
    date.setHours(0, 0, 0, 0);
    const attendance = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date } },
    });

    const correction = await this.prisma.attendanceCorrection.create({
      data: {
        organizationId: employee.organizationId,
        employeeId: employee.id,
        attendanceId: attendance?.id,
        date,
        requestedCheckIn: dto.requestedCheckIn ? new Date(dto.requestedCheckIn) : undefined,
        requestedCheckOut: dto.requestedCheckOut ? new Date(dto.requestedCheckOut) : undefined,
        reason: dto.reason,
      },
    });

    const admins = await this.prisma.user.findMany({
      where: { organizationId: employee.organizationId, role: { in: ['ORG_ADMIN', 'HR_MANAGER'] } },
    });
    await Promise.all(
      admins.map((a) =>
        this.notifications.create(
          employee.organizationId,
          a.id,
          'ATTENDANCE_CORRECTION_REQUESTED',
          `${employee.fullName} requested an attendance correction for ${dto.date}`,
        ),
      ),
    );

    return correction;
  }

  listCorrections(organizationId: string, status?: string) {
    return this.prisma.attendanceCorrection.findMany({
      where: { organizationId, ...(status ? { status: status as never } : {}) },
      include: { employee: { select: { id: true, fullName: true, employeeCode: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewCorrection(
    organizationId: string,
    reviewerId: string,
    id: string,
    dto: ReviewCorrectionDto,
  ) {
    const correction = await this.prisma.attendanceCorrection.findFirst({
      where: { id, organizationId },
      include: { employee: true },
    });
    if (!correction) throw new NotFoundException('Correction request not found');
    if (correction.status !== 'PENDING') throw new ForbiddenException('Already reviewed');

    const updated = await this.prisma.attendanceCorrection.update({
      where: { id },
      data: { status: dto.status, reviewNote: dto.reviewNote, reviewedById: reviewerId },
    });

    if (dto.status === 'APPROVED') {
      await this.prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: correction.employeeId, date: correction.date } },
        create: {
          organizationId,
          employeeId: correction.employeeId,
          date: correction.date,
          checkIn: correction.requestedCheckIn ?? undefined,
          checkOut: correction.requestedCheckOut ?? undefined,
          status: 'PRESENT',
        },
        update: {
          checkIn: correction.requestedCheckIn ?? undefined,
          checkOut: correction.requestedCheckOut ?? undefined,
        },
      });
    }

    if (correction.employee.userId) {
      await this.notifications.create(
        organizationId,
        correction.employee.userId,
        'ATTENDANCE_CORRECTION_REVIEWED',
        `Your attendance correction for ${correction.date.toDateString()} was ${dto.status.toLowerCase()}`,
      );
    }

    return updated;
  }
}
