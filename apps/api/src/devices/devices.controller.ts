import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname, join } from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const multerLib = require('multer');
import { Role } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateDeviceDto } from './dto/create-device.dto';
import { CreateDevicePhotoDto } from './dto/create-device-photo.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { UpdateDevicePhotoDto } from './dto/update-device-photo.dto';
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
  @Roles(Role.WORKER)
  create(@Request() req: any, @Body() dto: CreateDeviceDto) {
    return this.devicesService.create(req.user, dto);
  }

  @Patch('devices/:id')
  @Roles(Role.WORKER)
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(req.user, id, dto);
  }

  @Delete('devices/:id')
  @Roles(Role.WORKER)
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.devicesService.remove(req.user, id);
  }

  @Get('devices/:id/photos')
  @Roles(Role.CLIENT)
  findPhotos(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.devicesService.findPhotos(req.user, id);
  }

  @Post('uploads/device-photos')
  @Roles(Role.WORKER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerLib.diskStorage({
        destination: join(process.cwd(), 'uploads', 'device-photos'),
        filename: (_req: any, file: any, cb: any) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req: any, file: any, cb: any) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadDevicePhoto(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    return { url: `/uploads/device-photos/${file.filename}` };
  }

  @Post('devices/:id/photos')
  @Roles(Role.WORKER)
  createPhoto(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateDevicePhotoDto,
  ) {
    return this.devicesService.createPhoto(req.user, id, dto);
  }

  @Patch('device-photos/:id')
  @Roles(Role.WORKER)
  updatePhoto(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDevicePhotoDto,
  ) {
    return this.devicesService.updatePhoto(req.user, id, dto);
  }

  @Delete('device-photos/:id')
  @Roles(Role.WORKER)
  removePhoto(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.devicesService.removePhoto(req.user, id);
  }
}
