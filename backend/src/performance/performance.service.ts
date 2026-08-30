import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCycleDto,
  CreateGoalDto,
  ManagerReviewDto,
  SelfReviewDto,
  UpdateCycleDto,
  UpdateGoalDto,
} from './dto/performance.dto';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  private async myEmployee(userId: string) {
    const employee = await this.prisma.employee.findFirst({ where: { userId } });
    if (!employee) throw new BadRequestException('No employee profile linked to this account');
    return employee;
  }

  // Cycles
  listCycles(organizationId: string) {
    return this.prisma.performanceCycle.findMany({
      where: { organizationId },
      orderBy: { startDate: 'desc' },
    });
  }

  createCycle(organizationId: string, dto: CreateCycleDto) {
    return this.prisma.performanceCycle.create({
      data: { ...dto, organizationId, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) },
    });
  }

  async updateCycle(organizationId: string, id: string, dto: UpdateCycleDto) {
    const cycle = await this.prisma.performanceCycle.findFirst({ where: { id, organizationId } });
    if (!cycle) throw new NotFoundException('Performance cycle not found');
    return this.prisma.performanceCycle.update({ where: { id }, data: dto });
  }

  // Goals
  async listGoals(organizationId: string, cycleId: string, employeeId?: string) {
    const cycle = await this.prisma.performanceCycle.findFirst({ where: { id: cycleId, organizationId } });
    if (!cycle) throw new NotFoundException('Performance cycle not found');
    return this.prisma.goal.findMany({
      where: { cycleId, ...(employeeId ? { employeeId } : {}) },
      include: { employee: { select: { id: true, fullName: true, employeeCode: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myGoals(userId: string, cycleId: string) {
    const employee = await this.myEmployee(userId);
    return this.prisma.goal.findMany({ where: { cycleId, employeeId: employee.id }, orderBy: { createdAt: 'desc' } });
  }

  async createGoal(organizationId: string, cycleId: string, dto: CreateGoalDto) {
    const cycle = await this.prisma.performanceCycle.findFirst({ where: { id: cycleId, organizationId } });
    if (!cycle) throw new NotFoundException('Performance cycle not found');
    const employee = await this.prisma.employee.findFirst({ where: { id: dto.employeeId, organizationId } });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.prisma.goal.create({ data: { cycleId, employeeId: dto.employeeId, title: dto.title, description: dto.description } });
  }

  async updateGoal(organizationId: string, id: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.goal.findFirst({ where: { id, cycle: { organizationId } } });
    if (!goal) throw new NotFoundException('Goal not found');
    return this.prisma.goal.update({ where: { id }, data: dto });
  }

  async removeGoal(organizationId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({ where: { id, cycle: { organizationId } } });
    if (!goal) throw new NotFoundException('Goal not found');
    await this.prisma.goal.delete({ where: { id } });
    return { success: true };
  }

  // Reviews
  async listReviews(organizationId: string, cycleId: string) {
    const cycle = await this.prisma.performanceCycle.findFirst({ where: { id: cycleId, organizationId } });
    if (!cycle) throw new NotFoundException('Performance cycle not found');
    return this.prisma.performanceReview.findMany({
      where: { cycleId },
      include: {
        employee: { select: { id: true, fullName: true, employeeCode: true } },
        manager: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async myReview(userId: string, cycleId: string) {
    const employee = await this.myEmployee(userId);
    return this.prisma.performanceReview.findUnique({
      where: { cycleId_employeeId: { cycleId, employeeId: employee.id } },
    });
  }

  async submitSelfReview(userId: string, cycleId: string, dto: SelfReviewDto) {
    const employee = await this.myEmployee(userId);
    const cycle = await this.prisma.performanceCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new NotFoundException('Performance cycle not found');

    return this.prisma.performanceReview.upsert({
      where: { cycleId_employeeId: { cycleId, employeeId: employee.id } },
      create: {
        cycleId,
        employeeId: employee.id,
        managerId: employee.managerId,
        selfRating: dto.selfRating,
        selfFeedback: dto.selfFeedback,
      },
      update: { selfRating: dto.selfRating, selfFeedback: dto.selfFeedback },
    });
  }

  async submitManagerReview(organizationId: string, cycleId: string, employeeId: string, dto: ManagerReviewDto) {
    const cycle = await this.prisma.performanceCycle.findFirst({ where: { id: cycleId, organizationId } });
    if (!cycle) throw new NotFoundException('Performance cycle not found');
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.performanceReview.upsert({
      where: { cycleId_employeeId: { cycleId, employeeId } },
      create: {
        cycleId,
        employeeId,
        managerId: employee.managerId,
        managerRating: dto.managerRating,
        managerFeedback: dto.managerFeedback,
        finalRating: dto.finalRating,
      },
      update: {
        managerRating: dto.managerRating,
        managerFeedback: dto.managerFeedback,
        finalRating: dto.finalRating,
      },
    });
  }
}
