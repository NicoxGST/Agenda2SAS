import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateDeviceDto } from './dto/create-device.dto';
import { CreateDevicePhotoDto } from './dto/create-device-photo.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DevicesService } from './devices.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get('devices/my')
  @Roles(Role.CLIENT)
  findMy(@Request() req: any) {
    return this.devicesService.findMy(req.user.id);
  }

  @Get('devices/clients')
  @Roles(Role.WORKER)
  findClients(@Query('search') search?: string) {
    return this.devicesService.findClients(search);
  }

  @Get('devices')
  @Roles(Role.WORKER)
  findAll(@Query('clientId') clientId?: string) {
    return this.devicesService.findAll(clientId ? Number(clientId) : undefined);
  }

  @Get('devices/:id/details')
  @Roles(Role.CLIENT)
  findDetails(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.devicesService.findDetails(req.user, id);
  }

  @Get('devices/:id')
  @Roles(Role.CLIENT)
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.devicesService.findOne(req.user, id);
  }

  @Post('devices')
  @Roles(Role.CLIENT)
  create(@Request() req: any, @Body() dto: CreateDeviceDto) {
    return this.devicesService.create(req.user, dto);
  }

  @Patch('devices/:id')
  @Roles(Role.CLIENT)
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(req.user, id, dto);
  }

  @Get('devices/:id/photos')
  @Roles(Role.CLIENT)
  findPhotos(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.devicesService.findPhotos(req.user, id);
  }

  @Post('devices/:id/photos')
  @Roles(Role.CLIENT)
  createPhoto(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateDevicePhotoDto,
  ) {
    return this.devicesService.createPhoto(req.user, id, dto);
  }

  @Delete('device-photos/:id')
  @Roles(Role.CLIENT)
  removePhoto(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.devicesService.removePhoto(req.user, id);
  }
}
