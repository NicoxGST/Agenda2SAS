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
import { AttendReservationDto } from './dto/attend-reservation.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll(
    @Query('status') status?: string,
    @Query('workerId') workerId?: string,
    @Query('date') date?: string,
  ) {
    return this.reservationsService.findAll({ status, workerId, date });
  }

  @Get('my')
  @Roles(Role.CLIENT)
  findMine(@Request() req: any) {
    return this.reservationsService.findByClient(req.user.id);
  }

  @Get('worker/my')
  @Roles(Role.WORKER)
  findWorkerReservations(@Request() req: any) {
    return this.reservationsService.findByWorker(req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(id);
  }

  @Post()
  @Roles(Role.CLIENT)
  create(@Request() req: any, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(req.user, dto);
  }

  @Post(':id/attend')
  @Roles(Role.WORKER)
  attend(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AttendReservationDto,
  ) {
    return this.reservationsService.attend(req.user, id, dto);
  }

  @Patch(':id')
  @Roles(Role.WORKER, Role.ADMIN)
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(req.user, id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.WORKER)
  updateStatus(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(req.user, id, dto.status);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.remove(id);
  }
}
