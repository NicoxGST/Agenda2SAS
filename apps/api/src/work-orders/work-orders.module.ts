import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
})
export class WorkOrdersModule {}
