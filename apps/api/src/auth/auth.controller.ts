import {
  Body,
  Controller,
  Post,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {

  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(
    @Body() registerDto: RegisterDto,
  ) {
    return this.authService.register(
      registerDto,
    );
  }

  @Post('login')
  login(
    @Body() loginDto: LoginDto,
  ) {
    return this.authService.login(
      loginDto,
    );
  }

  @Post('verify-email')
  verifyEmail(
    @Body() dto: VerifyEmailDto,
  ) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-code')
  resendCode(
    @Body() dto: ResendCodeDto,
  ) {
    return this.authService.resendCode(dto);
  }

  @Post('verify-reset-code')
  verifyResetCode(
    @Body() dto: VerifyEmailDto,
  ) {
    return this.authService.verifyResetCode(dto.email, dto.code);
  }

  @Post('forgot-password')
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(
    @Body() dto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(dto);
  }

  @Post('refresh')
  refresh(
    @Body() dto: RefreshDto,
  ) {
    return this.authService.refresh(
      dto.refreshToken,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(
    @Request() req: any,
  ) {
    return this.authService.logout(
      req.user.id,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(
    @Request() req: any,
  ) {
    return this.authService.me(
      req.user.id,
    );
  }
}