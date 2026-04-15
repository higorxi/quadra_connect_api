import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ProfileType } from '../common/enums/profile-type.enum';
import { CustomerSummary } from './interfaces/customer-summary.interface';

type CustomerDbAccessor = Pick<PrismaService, 'customer'>;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findFirst(args: Prisma.CustomerFindFirstArgs, db?: CustomerDbAccessor) {
    return this.customerModel(db).findFirst(args);
  }

  async findMany(
    args?: Prisma.CustomerFindManyArgs,
    db?: CustomerDbAccessor,
  ): Promise<CustomerSummary[]> {
    return this.customerModel(db).findMany({
      ...args,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    args: Prisma.CustomerCreateArgs,
    db?: CustomerDbAccessor,
  ): Promise<CustomerSummary> {
    return this.customerModel(db).create(args);
  }

  async update(
    args: Prisma.CustomerUpdateArgs,
    db?: CustomerDbAccessor,
  ): Promise<CustomerSummary> {
    return this.customerModel(db).update(args);
  }

  async findOwnProfile(authenticatedUser: AuthenticatedUser): Promise<CustomerSummary> {
    if (authenticatedUser.profileType !== ProfileType.CUSTOMER) {
      throw new ForbiddenException(
        'Apenas usuários customer podem acessar este endpoint.',
      );
    }

    const customer = await this.findFirst({
      where: { userId: authenticatedUser.sub },
    });

    if (!customer) {
      throw new NotFoundException('Customer não encontrado para este usuário.');
    }

    return customer;
  }

  async findByUserIdOrThrow(userId: string): Promise<CustomerSummary> {
    const customer = await this.findFirst({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer não encontrado para este usuário.');
    }

    return customer;
  }

  private customerModel(db?: CustomerDbAccessor) {
    return db?.customer ?? this.prisma.customer;
  }
}
