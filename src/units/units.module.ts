import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CompaniesModule } from '../companies/companies.module';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';

@Module({
  imports: [PrismaModule, CompaniesModule],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [UnitsService],
})
export class UnitsModule {}
