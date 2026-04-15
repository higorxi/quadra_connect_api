import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { CustomersModule } from '../customers/customers.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [PrismaModule, CustomersModule, CompaniesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
