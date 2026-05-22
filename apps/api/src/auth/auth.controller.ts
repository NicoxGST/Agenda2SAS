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