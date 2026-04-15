import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Customer,
  Prisma,
  UserRole as PrismaUserRole,
} from '../../generated/prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ProfileType } from '../common/enums/profile-type.enum';
import { CustomerSummary } from './interfaces/customer-summary.interface';

type CustomerDbAccessor = Pick<PrismaService, 'customer'>;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomersBy(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CustomerWhereUniqueInput;
    where?: Prisma.CustomerWhereInput;
    orderBy?: Prisma.CustomerOrderByWithRelationInput;
  }): Promise<Customer[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return await this.prisma.customer.findMany({
      where,
      skip,
      take,
      cursor,
      orderBy,
    });
  }

  async listCustomers(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CustomerWhereUniqueInput;
    where?: Prisma.CustomerWhereInput;
    orderBy?: Prisma.CustomerOrderByWithRelationInput;
  }): Promise<Customer[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return await this.prisma.customer.findMany({
      where,
      skip,
      take,
      cursor,
      orderBy,
    });
  }

  async findCustomer(
    data: Prisma.CustomerWhereInput,
    db?: CustomerDbAccessor,
  ): Promise<Customer | null> {
    return await this.customerModel(db).findFirst({
      where: data,
    });
  }

  async updateCustomer(params: {
    where: Prisma.CustomerWhereUniqueInput;
    data: Prisma.CustomerUncheckedUpdateInput;
  }): Promise<Customer> {
    const { where, data } = params;
    return await this.prisma.customer.update({
      where,
      data,
    });
  }

  async updateManyCustomers(params: {
    where: Prisma.CustomerWhereInput;
    data: Prisma.CustomerUpdateManyMutationInput;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    return await this.prisma.customer.updateMany({
      where,
      data,
    });
  }

  async createCustomer(data: Prisma.CustomerUncheckedCreateInput): Promise<Customer> {
    return await this.prisma.customer.create({
      data,
    });
  }

  async deleteCustomer(customerId: string): Promise<Customer> {
    return await this.prisma.customer.delete({
      where: { id: customerId },
    });
  }

  async findFirst(
    args: Prisma.CustomerFindFirstArgs,
    db?: CustomerDbAccessor,
  ): Promise<Customer | null> {
    return await this.customerModel(db).findFirst(args);
  }

  async findMany(
    args?: Prisma.CustomerFindManyArgs,
    db?: CustomerDbAccessor,
  ): Promise<Customer[]> {
    return await this.customerModel(db).findMany({
      ...args,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    args: Prisma.CustomerCreateArgs,
    db?: CustomerDbAccessor,
  ): Promise<Customer> {
    return await this.customerModel(db).create(args);
  }

  async update(
    args: Prisma.CustomerUpdateArgs,
    db?: CustomerDbAccessor,
  ): Promise<Customer> {
    return await this.customerModel(db).update(args);
  }

  async findOwnProfile(authenticatedUser: AuthenticatedUser): Promise<CustomerSummary> {
    if (authenticatedUser.profileType !== ProfileType.CUSTOMER) {
      throw new ForbiddenException(
        'Apenas usuários customer podem acessar este endpoint.',
      );
    }

    const customer = await this.findCustomer(
      { userId: authenticatedUser.sub },
      undefined,
    );

    if (!customer) {
      throw new NotFoundException('Customer não encontrado para este usuário.');
    }

    return customer;
  }

  async findByUserIdOrThrow(userId: string): Promise<CustomerSummary> {
    const customer = await this.findCustomer({ userId }, undefined);

    if (!customer) {
      throw new NotFoundException('Customer não encontrado para este usuário.');
    }

    return customer;
  }

  private customerModel(db?: CustomerDbAccessor) {
    return db?.customer ?? this.prisma.customer;
  }

  private mapPrismaRoleToProfileType(role: PrismaUserRole): ProfileType {
    return role === PrismaUserRole.LOCATOR
      ? ProfileType.COMPANY
      : ProfileType.CUSTOMER;
  }
}
