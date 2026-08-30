import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CreateOnboardingTaskDto, UpdateOnboardingTaskDto } from './dto/onboarding-task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORG_ADMIN', 'HR_MANAGER')
@Controller('onboarding')
export class OnboardingController {
  constructor(private service: OnboardingService) {}

  @Get('employees/:employeeId')
  list(@CurrentUser() user: AuthUser, @Param('employeeId') employeeId: string) {
    return this.service.listForEmployee(user.organizationId!, employeeId);
  }

  @Post('employees/:employeeId')
  addTask(
    @CurrentUser() user: AuthUser,
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateOnboardingTaskDto,
  ) {
    return this.service.addTask(user.organizationId!, employeeId, dto);
  }

  @Put('tasks/:id')
  updateTask(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateOnboardingTaskDto) {
    return this.service.updateTask(user.organizationId!, id, dto);
  }

  @Delete('tasks/:id')
  removeTask(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeTask(user.organizationId!, id);
  }
}
