import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { PrismaModule } from './prisma/prisma.module';
import { CustomersModule } from './customers/customers.module';
import { ConfigModule } from '@nestjs/config';
import { CategoriesModule } from './categories/categories.module';
import { UnitsModule } from './units/units.module';
import { ReservationsModule } from './reservations/reservations.module';
import { CommunitiesModule } from './communities/communities.module';
import { ReviewsModule } from './reviews/reviews.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    CompaniesModule,
    CategoriesModule,
    UnitsModule,
    ReservationsModule,
    CommunitiesModule,
    ReviewsModule,
    TransactionsModule,
    PrismaModule,
    CustomersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
