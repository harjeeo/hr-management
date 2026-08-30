import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user';
import { UploadDocumentDto } from './dto/document.dto';

const UPLOAD_ROOT = join(process.cwd(), 'uploads');

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  private async assertAccess(user: AuthUser, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId: user.organizationId! },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const isSelf = employee.userId === user.userId;
    const isHr = ['ORG_ADMIN', 'HR_MANAGER'].includes(user.role);
    if (!isSelf && !isHr) throw new ForbiddenException('Not allowed to access these documents');

    return employee;
  }

  async list(user: AuthUser, employeeId: string) {
    await this.assertAccess(user, employeeId);
    return this.prisma.document.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(user: AuthUser, dto: UploadDocumentDto, file: Express.Multer.File) {
    await this.assertAccess(user, dto.employeeId);
    return this.prisma.document.create({
      data: {
        organizationId: user.organizationId!,
        employeeId: dto.employeeId,
        category: dto.category ?? 'OTHER',
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
        fileSize: file.size,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        uploadedById: user.userId,
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, organizationId: user.organizationId! },
    });
    if (!doc) throw new NotFoundException('Document not found');
    await this.assertAccess(user, doc.employeeId);

    await this.prisma.document.delete({ where: { id } });
    try {
      await unlink(join(UPLOAD_ROOT, doc.fileUrl.replace('/uploads/', '')));
    } catch {
      // file already gone, ignore
    }
    return { success: true };
  }
}
