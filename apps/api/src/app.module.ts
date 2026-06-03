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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      envFilePath: 'apps/api/.env',
    }),

    AuthModule,

    UsersModule,

    PrismaModule,

    ServicesModule,

    ProductsModule,

    AvailabilityModule,

    ReservationsModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
