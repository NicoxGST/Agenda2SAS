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
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkOrdersService } from './work-orders.service';

@Controller('work-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  @Roles(Role.CLIENT)
  findAll(@Request() req: any) {
    return this.workOrdersService.findAll(req.user);
  }

  @Get(':id')
  @Roles(Role.CLIENT)
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.workOrdersService.findOne(req.user, id);
  }

  @Post()
  @Roles(Role.WORKER)
  create(@Request() req: any, @Body() dto: CreateWorkOrderDto) {
    return this.workOrdersService.create(req.user, dto);
  }

  @Patch(':id')
  @Roles(Role.WORKER)
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkOrderDto,
  ) {
    return this.workOrdersService.update(req.user, id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.WORKER)
  updateStatus(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkOrderStatusDto,
  ) {
    return this.workOrdersService.updateStatus(req.user, id, dto.status);
  }
}
