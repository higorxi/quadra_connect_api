import {
  BadRequestException,
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
    const transactionRelations = await this.resolveTransactionRelations(
      customer.id,
      createTransactionDto,
    );

    const transaction = await this.prismaService.transaction.create({
      data: {
        customerId: customer.id,
        companyId: transactionRelations.companyId,
        reservationId: transactionRelations.reservationId,
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

  async findForCompany(
    authenticatedUser: AuthenticatedUser,
  ): Promise<TransactionSummary[]> {
    const company = await this.companiesService.findCompanyByUserId(
      authenticatedUser.sub,
    );

    const transactions = await this.prismaService.transaction.findMany({
      where: {
        OR: [
          { companyId: company.id },
          {
            reservation: {
              unit: {
                companyId: company.id,
              },
            },
          },
        ],
      },
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
      include: {
        reservation: {
          select: {
            unit: {
              select: {
                companyId: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada.');
    }

    await this.assertCanAccess(authenticatedUser, transaction);

    return this.toSummary(transaction);
  }

  async updateStatus(
    authenticatedUser: AuthenticatedUser,
    transactionId: string,
    updateTransactionStatusDto: UpdateTransactionStatusDto,
  ): Promise<TransactionSummary> {
    const transaction = await this.prismaService.transaction.findUnique({
      where: { id: transactionId },
      include: {
        reservation: {
          select: {
            unit: {
              select: {
                companyId: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada.');
    }

    if (authenticatedUser.profileType !== ProfileType.COMPANY) {
      throw new ForbiddenException(
        'Somente usuários company podem alterar status de transação.',
      );
    }

    await this.assertCompanyCanAccess(authenticatedUser, transaction);

    const updatedTransaction = await this.prismaService.transaction.update({
      where: { id: transactionId },
      data: {
        status: updateTransactionStatusDto.status,
      },
    });

    return this.toSummary(updatedTransaction);
  }

  private async resolveTransactionRelations(
    customerId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<{ companyId?: string; reservationId?: string }> {
    if (!createTransactionDto.reservationId) {
      if (createTransactionDto.companyId) {
        await this.ensureCompanyExists(createTransactionDto.companyId);
      }

      return {
        companyId: createTransactionDto.companyId,
      };
    }

    const reservation = await this.prismaService.reservation.findUnique({
      where: { id: createTransactionDto.reservationId },
      include: {
        unit: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    if (reservation.customerId !== customerId) {
      throw new ForbiddenException(
        'Você só pode vincular transações às suas próprias reservas.',
      );
    }

    if (
      createTransactionDto.companyId &&
      createTransactionDto.companyId !== reservation.unit.companyId
    ) {
      throw new BadRequestException(
        'A empresa informada não pertence à reserva.',
      );
    }

    return {
      companyId: reservation.unit.companyId,
      reservationId: reservation.id,
    };
  }

  private async ensureCompanyExists(companyId: string): Promise<void> {
    const company = await this.prismaService.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Company não encontrada.');
    }
  }

  private async assertCanAccess(
    authenticatedUser: AuthenticatedUser,
    transaction: {
      customerId: string;
      companyId: string | null;
      reservation?: {
        unit: {
          companyId: string;
        };
      } | null;
    },
  ): Promise<void> {
    if (authenticatedUser.profileType === ProfileType.CUSTOMER) {
      const customer = await this.customersService.findByUserIdOrThrow(
        authenticatedUser.sub,
      );

      if (customer.id !== transaction.customerId) {
        throw new ForbiddenException('Você não tem acesso a essa transação.');
      }

      return;
    }

    if (authenticatedUser.profileType === ProfileType.COMPANY) {
      await this.assertCompanyCanAccess(authenticatedUser, transaction);
    }
  }

  private async assertCompanyCanAccess(
    authenticatedUser: AuthenticatedUser,
    transaction: {
      companyId: string | null;
      reservation?: {
        unit: {
          companyId: string;
        };
      } | null;
    },
  ): Promise<void> {
    const company = await this.companiesService.findCompanyByUserId(
      authenticatedUser.sub,
    );
    const transactionCompanyId =
      transaction.companyId ?? transaction.reservation?.unit.companyId ?? null;

    if (transactionCompanyId !== company.id) {
      throw new ForbiddenException('Você não tem acesso a essa transação.');
    }
  }

  private toSummary(transaction: {
    id: string;
    customerId: string;
    companyId: string | null;
    reservationId: string | null;
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
      companyId: transaction.companyId,
      reservationId: transaction.reservationId,
      amount: transaction.amount.toString(),
      type: transaction.type,
      status: transaction.status,
      pixCode: transaction.pixCode,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
