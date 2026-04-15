import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Customer,
  Prisma,
} from '../../generated/prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ProfileType } from '../common/enums/profile-type.enum';
import { CustomerSummary } from './interfaces/customer-summary.interface';

@Injectable()
export class CustomersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getCustomersBy(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CustomerWhereUniqueInput;
    where?: Prisma.CustomerWhereInput;
    orderBy?: Prisma.CustomerOrderByWithRelationInput;
  }): Promise<Customer[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return await this.prismaService.customer.findMany({
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
    return await this.prismaService.customer.findMany({
      where,
      skip,
      take,
      cursor,
      orderBy,
    });
  }

  async findCustomer(
    data: Prisma.CustomerWhereInput,
  ): Promise<Customer | null> {
    return await this.prismaService.customer.findFirst({
      where: data,
    });
  }

  async updateCustomer(params: {
    where: Prisma.CustomerWhereUniqueInput;
    data: Prisma.CustomerUncheckedUpdateInput;
  }): Promise<Customer> {
    const { where, data } = params;
    return await this.prismaService.customer.update({
      where,
      data,
    });
  }

  async updateManyCustomers(params: {
    where: Prisma.CustomerWhereInput;
    data: Prisma.CustomerUpdateManyMutationInput;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    return await this.prismaService.customer.updateMany({
      where,
      data,
    });
  }

  async createCustomer(data: Prisma.CustomerUncheckedCreateInput): Promise<Customer> {
    return await this.prismaService.customer.create({
      data,
    });
  }

  async deleteCustomer(customerId: string): Promise<Customer> {
    return await this.prismaService.customer.delete({
      where: { id: customerId },
    });
  }

  async findFirst(args: Prisma.CustomerFindFirstArgs): Promise<Customer | null> {
    return await this.prismaService.customer.findFirst(args);
  }

  async findMany(args?: Prisma.CustomerFindManyArgs): Promise<Customer[]> {
    return await this.prismaService.customer.findMany({
      ...args,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(args: Prisma.CustomerCreateArgs): Promise<Customer> {
    return await this.prismaService.customer.create(args);
  }

  async update(args: Prisma.CustomerUpdateArgs): Promise<Customer> {
    return await this.prismaService.customer.update(args);
  }

  async findOwnProfile(authenticatedUser: AuthenticatedUser): Promise<CustomerSummary> {
    if (authenticatedUser.profileType !== ProfileType.CUSTOMER) {
      throw new ForbiddenException(
        'Apenas usuários customer podem acessar este endpoint.',
      );
    }

    const customer = await this.findCustomer({ userId: authenticatedUser.sub });

    if (!customer) {
      throw new NotFoundException('Customer não encontrado para este usuário.');
    }

    return customer;
  }

  async findByUserIdOrThrow(userId: string): Promise<CustomerSummary> {
    const customer = await this.findCustomer({ userId });

    if (!customer) {
      throw new NotFoundException('Customer não encontrado para este usuário.');
    }

    return customer;
  }
}
