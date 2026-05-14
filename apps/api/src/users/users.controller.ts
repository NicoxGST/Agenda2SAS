import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';

import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('users')
export class UsersController {

  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Patch(':id/role')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.SUPER_ADMIN)
  updateRole(
    @Request() req: any,

    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(
      req.user,
      id,
      dto.role,
    );
  }
}