import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { ChangePlanDto } from './dto/subscription.dto';

function monthlyEquivalent(price: number, cycle: string): number {
  return cycle === 'YEARLY' ? price / 12 : price;
}

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  // Plans (public list for any authenticated user, mutate for super admin)
  listPlans() {
    return this.prisma.plan.findMany({ where: { isActive: true }, orderBy: { price: 'asc' } });
  }

  listAllPlans() {
    return this.prisma.plan.findMany({ orderBy: { price: 'asc' } });
  }

  async createPlan(dto: CreatePlanDto) {
    const exists = await this.prisma.plan.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Plan already exists');
    return this.prisma.plan.create({ data: dto });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.prisma.plan.update({ where: { id }, data: dto });
  }

  // Org subscription
  async mySubscription(organizationId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true, invoices: { orderBy: { issuedAt: 'desc' } } },
    });
    if (!sub) throw new NotFoundException('No subscription found');
    return sub;
  }

  async changePlan(organizationId: string, dto: ChangePlanDto) {
    const sub = await this.prisma.subscription.findUnique({ where: { organizationId } });
    if (!sub) throw new NotFoundException('No subscription found');
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan || !plan.isActive) throw new NotFoundException('Plan not found');

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (plan.billingCycle === 'YEARLY' ? 12 : 1));

    const updated = await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        planId: plan.id,
        status: plan.price === 0 ? 'ACTIVE' : 'PAST_DUE',
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    if (plan.price > 0) {
      await this.prisma.invoice.create({
        data: { subscriptionId: sub.id, amount: plan.price, status: 'PENDING' },
      });
    }

    return updated;
  }

  // Super admin
  async listSubscriptions() {
    return this.prisma.subscription.findMany({
      include: {
        plan: true,
        organization: { select: { id: true, name: true, slug: true } },
        invoices: { orderBy: { issuedAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markInvoicePaid(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: { subscription: true } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    await this.prisma.invoice.update({ where: { id }, data: { status: 'PAID', paidAt: new Date() } });
    return this.prisma.subscription.update({
      where: { id: invoice.subscriptionId },
      data: { status: 'ACTIVE' },
    });
  }

  async billingStats() {
    const activeSubs = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });
    const mrr = activeSubs.reduce((sum, s) => sum + monthlyEquivalent(s.plan.price, s.plan.billingCycle), 0);
    return {
      mrr,
      arr: mrr * 12,
      activeSubscriptions: activeSubs.length,
    };
  }
}
