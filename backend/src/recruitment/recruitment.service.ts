import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobOpeningDto, UpdateJobOpeningDto } from './dto/job-opening.dto';
import { CreateCandidateDto, UpdateCandidateDto } from './dto/candidate.dto';

const DEFAULT_ONBOARDING_TASKS = [
  'Collect personal documents',
  'Verify ID proof',
  'Verify address proof',
  'Collect education certificates',
  'Sign offer letter',
  'Sign employment agreement',
  'Accept company policies',
  'Assign IT assets',
  'Complete joining formalities',
];

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  // Job openings
  listJobs(organizationId: string) {
    return this.prisma.jobOpening.findMany({
      where: { organizationId },
      include: {
        department: true,
        designation: true,
        _count: { select: { candidates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createJob(organizationId: string, dto: CreateJobOpeningDto) {
    return this.prisma.jobOpening.create({ data: { ...dto, organizationId } });
  }

  private async findJobOwned(organizationId: string, id: string) {
    const job = await this.prisma.jobOpening.findFirst({ where: { id, organizationId } });
    if (!job) throw new NotFoundException('Job opening not found');
    return job;
  }

  async updateJob(organizationId: string, id: string, dto: UpdateJobOpeningDto) {
    await this.findJobOwned(organizationId, id);
    return this.prisma.jobOpening.update({ where: { id }, data: dto });
  }

  async removeJob(organizationId: string, id: string) {
    await this.findJobOwned(organizationId, id);
    await this.prisma.jobOpening.delete({ where: { id } });
    return { success: true };
  }

  // Candidates
  listCandidates(organizationId: string, jobOpeningId?: string) {
    return this.prisma.candidate.findMany({
      where: { organizationId, ...(jobOpeningId ? { jobOpeningId } : {}) },
      include: { jobOpening: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCandidate(organizationId: string, dto: CreateCandidateDto) {
    const job = await this.prisma.jobOpening.findFirst({
      where: { id: dto.jobOpeningId, organizationId },
    });
    if (!job) throw new NotFoundException('Job opening not found');
    return this.prisma.candidate.create({ data: { ...dto, organizationId } });
  }

  private async findCandidateOwned(organizationId: string, id: string) {
    const candidate = await this.prisma.candidate.findFirst({ where: { id, organizationId } });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async updateCandidate(organizationId: string, id: string, dto: UpdateCandidateDto) {
    await this.findCandidateOwned(organizationId, id);
    return this.prisma.candidate.update({ where: { id }, data: dto });
  }

  async removeCandidate(organizationId: string, id: string) {
    await this.findCandidateOwned(organizationId, id);
    await this.prisma.candidate.delete({ where: { id } });
    return { success: true };
  }

  async setResume(organizationId: string, id: string, resumeUrl: string) {
    await this.findCandidateOwned(organizationId, id);
    return this.prisma.candidate.update({ where: { id }, data: { resumeUrl } });
  }

  async hireCandidate(organizationId: string, id: string, employeeCode: string) {
    const candidate = await this.findCandidateOwned(organizationId, id);
    const job = await this.prisma.jobOpening.findUnique({ where: { id: candidate.jobOpeningId } });

    const exists = await this.prisma.employee.findFirst({ where: { organizationId, employeeCode } });
    if (exists) throw new ConflictException('Employee code already in use');

    const employee = await this.prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          organizationId,
          employeeCode,
          fullName: candidate.fullName,
          email: candidate.email,
          phone: candidate.phone,
          departmentId: job?.departmentId ?? undefined,
          designationId: job?.designationId ?? undefined,
          joiningDate: new Date(),
        },
      });
      await tx.onboardingTask.createMany({
        data: DEFAULT_ONBOARDING_TASKS.map((title) => ({ employeeId: emp.id, title })),
      });
      await tx.candidate.update({ where: { id }, data: { stage: 'HIRED' } });
      return emp;
    });

    return employee;
  }
}
