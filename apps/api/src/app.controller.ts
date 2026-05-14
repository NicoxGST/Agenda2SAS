import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

import { Roles } from './auth/decorators/roles.decorator';

import { Role } from '@prisma/client';

@Controller()
export class AppController {

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  admin(@Req() req: any) {
    return {
      message: 'Bienvenido admin',
      user: req.user,
    };
  }
}