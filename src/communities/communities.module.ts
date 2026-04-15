import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';

@Module({
  imports: [PrismaModule, CustomersModule],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
  exports: [CommunitiesService],
})
export class CommunitiesModule {}
