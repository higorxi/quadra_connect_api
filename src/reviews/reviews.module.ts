import { Module } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { CustomersModule } from '../customers/customers.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [PrismaModule, CustomersModule, CompaniesModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
