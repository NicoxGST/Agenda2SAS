import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServicesModule } from './services/services.module';
import { ProductsModule } from './products/products.module';
import { AvailabilityModule } from './availability/availability.module';
import { ReservationsModule } from './reservations/reservations.module';
import { DevicesModule } from './devices/devices.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      envFilePath: '.env',
    }),

    AuthModule,

    UsersModule,

    PrismaModule,

    ServicesModule,

    ProductsModule,

    AvailabilityModule,

    ReservationsModule,

    DevicesModule,

    WorkOrdersModule,

    AdminModule,

    PaymentsModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
