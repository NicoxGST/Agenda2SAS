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
import { AvailabilityService } from './availability.service';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';
import { CreateWorkerAvailabilityDto } from './dto/create-worker-availability.dto';
import { UpdateWorkerAvailabilityDto } from './dto/update-worker-availability.dto';

@Controller('availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('workers')
  @Roles(Role.CLIENT)
  findWorkers() {
    return this.availabilityService.findWorkers();
  }

  @Get('available-slots')
  @Roles(Role.CLIENT)
  getAvailableSlots(@Query() query: AvailableSlotsQueryDto) {
    return this.availabilityService.getAvailableSlots(query.workerId, query.date);
  }

  @Get('my')
  @Roles(Role.WORKER)
  findMine(@Request() req: any) {
    return this.availabilityService.findMine(req.user.id);
  }

  @Get()
  @Roles(Role.WORKER)
  findAll(@Request() req: any, @Query('workerId') workerId?: string) {
    return this.availabilityService.findAll(
      req.user,
      workerId ? Number(workerId) : undefined,
    );
  }

  // Future phase: add exception blocks for vacations, permissions, holidays,
  // and ad-hoc agenda locks without changing the weekly availability model.
  @Post()
  @Roles(Role.WORKER)
  create(@Request() req: any, @Body() dto: CreateWorkerAvailabilityDto) {
    return this.availabilityService.create(req.user, dto);
  }

  @Patch(':id')
  @Roles(Role.WORKER)
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkerAvailabilityDto,
  ) {
    return this.availabilityService.update(req.user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.WORKER)
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.availabilityService.remove(req.user, id);
  }
}
