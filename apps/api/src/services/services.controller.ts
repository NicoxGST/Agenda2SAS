import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Role } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
  ) {}

  @Get('public')
  findPublicActive() {
    return this.servicesService.findPublicActive();
  }

  @Get()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  findAll() {
    return this.servicesService.findAll();
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
    return this.servicesService.findOne(id);
  }

  @Post()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  create(
    @Body()
    dto: CreateServiceDto,
  ) {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(Role.ADMIN)
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.servicesService.remove(id);
  }
}
