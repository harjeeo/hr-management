import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOnboardingTaskDto, UpdateOnboardingTaskDto } from './dto/onboarding-task.dto';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  private async findEmployeeOwned(organizationId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async listForEmployee(organizationId: string, employeeId: string) {
    await this.findEmployeeOwned(organizationId, employeeId);
    return this.prisma.onboardingTask.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addTask(organizationId: string, employeeId: string, dto: CreateOnboardingTaskDto) {
    await this.findEmployeeOwned(organizationId, employeeId);
    return this.prisma.onboardingTask.create({ data: { employeeId, title: dto.title } });
  }

  async updateTask(organizationId: string, id: string, dto: UpdateOnboardingTaskDto) {
    const task = await this.prisma.onboardingTask.findFirst({
      where: { id, employee: { organizationId } },
    });
    if (!task) throw new NotFoundException('Onboarding task not found');
    return this.prisma.onboardingTask.update({ where: { id }, data: dto });
  }

  async removeTask(organizationId: string, id: string) {
    const task = await this.prisma.onboardingTask.findFirst({
      where: { id, employee: { organizationId } },
    });
    if (!task) throw new NotFoundException('Onboarding task not found');
    await this.prisma.onboardingTask.delete({ where: { id } });
    return { success: true };
  }
}
