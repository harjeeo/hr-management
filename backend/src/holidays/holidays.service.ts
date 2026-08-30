import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';

@Injectable()
export class HolidaysService {
  constructor(private prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.holiday.findMany({ where: { organizationId }, orderBy: { date: 'asc' } });
  }

  async create(organizationId: string, dto: CreateHolidayDto) {
    return this.prisma.holiday.create({
      data: { ...dto, date: new Date(dto.date), organizationId },
    });
  }

  private async findOwned(organizationId: string, id: string) {
    const holiday = await this.prisma.holiday.findFirst({ where: { id, organizationId } });
    if (!holiday) throw new NotFoundException('Holiday not found');
    return holiday;
  }

  async update(organizationId: string, id: string, dto: UpdateHolidayDto) {
    await this.findOwned(organizationId, id);
    const { date, ...rest } = dto;
    return this.prisma.holiday.update({
      where: { id },
      data: { ...rest, date: date ? new Date(date) : undefined },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOwned(organizationId, id);
    await this.prisma.holiday.delete({ where: { id } });
    return { success: true };
  }
}
