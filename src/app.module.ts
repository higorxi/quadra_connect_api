import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { SpacesModule } from './spaces/spaces.module';
import { SchedulesModule } from './schedules/schedules.module';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CompaniesModule,
    SpacesModule,
    SchedulesModule,
    PrismaModule,
    CustomersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
