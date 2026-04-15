import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TransactionStatus,
} from '../../generated/prisma/client/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ProfileType } from '../common/enums/profile-type.enum';
import { CompaniesService } from '../companies/companies.service';
import { CustomersService } from '../customers/customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { TransactionSummary } from './interfaces/transaction-summary.interface';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly customersService: CustomersService,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(
    authenticatedUser: AuthenticatedUser,
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionSummary> {
    const customer = await this.customersService.findByUserIdOrThrow(
      authenticatedUser.sub,
    );

    const transaction = await this.prismaService.transaction.create({
      data: {
        customerId: customer.id,
        amount: createTransactionDto.amount,
        type: createTransactionDto.type,
        status: TransactionStatus.PENDING,
        pixCode: createTransactionDto.pixCode,
      },
    });

    return this.toSummary(transaction);
  }

  async findMine(
    authenticatedUser: AuthenticatedUser,
  ): Promise<TransactionSummary[]> {
    const customer = await this.customersService.findByUserIdOrThrow(
      authenticatedUser.sub,
    );
    const transactions = await this.prismaService.transaction.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((transaction) => this.toSummary(transaction));
  }

  async findOne(
    authenticatedUser: AuthenticatedUser,
    transactionId: string,
  ): Promise<TransactionSummary> {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada.');
    }

    await this.assertCanAccess(authenticatedUser, transaction.customerId);

    return this.toSummary(transaction);
  }

  async updateStatus(
    authenticatedUser: AuthenticatedUser,
    transactionId: string,
    updateTransactionStatusDto: UpdateTransactionStatusDto,
  ): Promise<TransactionSummary> {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada.');
    }

    if (authenticatedUser.profileType !== ProfileType.COMPANY) {
      throw new ForbiddenException(
        'Somente usuários company podem alterar status de transação.',
      );
    }

    await this.companiesService.findCompanyByUserId(authenticatedUser.sub);

    const updatedTransaction = await this.prismaService.transaction.update({
      where: { id: transactionId },
      data: {
        status: updateTransactionStatusDto.status,
      },
    });

    return this.toSummary(updatedTransaction);
  }

  private async assertCanAccess(
    authenticatedUser: AuthenticatedUser,
    customerId: string,
  ): Promise<void> {
    if (authenticatedUser.profileType === ProfileType.CUSTOMER) {
      const customer = await this.customersService.findByUserIdOrThrow(
        authenticatedUser.sub,
      );

      if (customer.id !== customerId) {
        throw new ForbiddenException('Você não tem acesso a essa transação.');
      }

      return;
    }

    await this.companiesService.findCompanyByUserId(authenticatedUser.sub);
  }

  private toSummary(transaction: {
    id: string;
    customerId: string;
    amount: Prisma.Decimal;
    type: TransactionSummary['type'];
    status: TransactionSummary['status'];
    pixCode: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): TransactionSummary {
    return {
      id: transaction.id,
      customerId: transaction.customerId,
      amount: transaction.amount.toString(),
      type: transaction.type,
      status: transaction.status,
      pixCode: transaction.pixCode,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
