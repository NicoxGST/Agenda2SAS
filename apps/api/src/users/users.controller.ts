import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.usersService.findPublicById(id);
  }

  @Patch(':id/role')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
  )
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

  @Delete(':id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.SUPER_ADMIN)
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.usersService.remove(id);
  }

  @Post()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.SUPER_ADMIN)
  create(
    @Body()
    dto: CreateUserDto,
  ) {
    return this.usersService.createByAdmin(
      dto,
    );
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @Request() req: any,

    @Body()
    dto: UpdateMeDto,
  ) {
    return this.usersService.updateMe(
      req.user.id,
      dto,
    );
  }
}