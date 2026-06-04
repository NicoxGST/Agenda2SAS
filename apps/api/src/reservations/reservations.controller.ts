import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.reservationsService.findAll();
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

  @Post()
  @Roles(Role.CLIENT)
  create(@Request() req: any, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(req.user, dto);
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
}
