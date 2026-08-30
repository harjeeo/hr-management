import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterOrgDto } from './dto/register-org.dto';
import { LoginDto } from './dto/login.dto';
import { TwoFactorCodeDto } from './dto/two-factor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register-organization')
  registerOrg(@Body() dto: RegisterOrgDto) {
    return this.authService.registerOrg(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  setupTwoFactor(@CurrentUser() user: AuthUser) {
    return this.authService.setupTwoFactor(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  enableTwoFactor(@CurrentUser() user: AuthUser, @Body() dto: TwoFactorCodeDto) {
    return this.authService.enableTwoFactor(user.userId, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  disableTwoFactor(@CurrentUser() user: AuthUser, @Body() dto: TwoFactorCodeDto) {
    return this.authService.disableTwoFactor(user.userId, dto.code);
  }
}
