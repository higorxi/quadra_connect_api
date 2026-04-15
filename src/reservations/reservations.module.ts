import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { CustomersModule } from '../customers/customers.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [PrismaModule, CustomersModule, CompaniesModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
