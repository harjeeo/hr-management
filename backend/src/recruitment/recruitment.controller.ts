import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { RecruitmentService } from './recruitment.service';
import { CreateJobOpeningDto, UpdateJobOpeningDto } from './dto/job-opening.dto';
import { CreateCandidateDto, UpdateCandidateDto } from './dto/candidate.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

const UPLOAD_ROOT = join(process.cwd(), 'uploads');
const ALLOWED_MIME = new Set(['application/pdf']);

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recruitment')
export class RecruitmentController {
  constructor(private service: RecruitmentService) {}

  @Get('jobs')
  listJobs(@CurrentUser() user: AuthUser) {
    return this.service.listJobs(user.organizationId!);
  }

  @Post('jobs')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  createJob(@CurrentUser() user: AuthUser, @Body() dto: CreateJobOpeningDto) {
    return this.service.createJob(user.organizationId!, dto);
  }

  @Put('jobs/:id')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  updateJob(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateJobOpeningDto) {
    return this.service.updateJob(user.organizationId!, id, dto);
  }

  @Delete('jobs/:id')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  removeJob(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeJob(user.organizationId!, id);
  }

  @Get('candidates')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  listCandidates(@CurrentUser() user: AuthUser, @Query('jobOpeningId') jobOpeningId?: string) {
    return this.service.listCandidates(user.organizationId!, jobOpeningId);
  }

  @Post('candidates')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  createCandidate(@CurrentUser() user: AuthUser, @Body() dto: CreateCandidateDto) {
    return this.service.createCandidate(user.organizationId!, dto);
  }

  @Put('candidates/:id')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  updateCandidate(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.service.updateCandidate(user.organizationId!, id, dto);
  }

  @Delete('candidates/:id')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  removeCandidate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeCandidate(user.organizationId!, id);
  }

  @Post('candidates/:id/resume')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_ROOT,
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          cb(new BadRequestException('Only PDF resumes are supported'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadResume(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.service.setResume(user.organizationId!, id, `/uploads/${file.filename}`);
  }

  @Post('candidates/:id/hire')
  @Roles('ORG_ADMIN', 'HR_MANAGER')
  hire(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('employeeCode') employeeCode: string,
  ) {
    if (!employeeCode) throw new BadRequestException('employeeCode is required');
    return this.service.hireCandidate(user.organizationId!, id, employeeCode);
  }
}
