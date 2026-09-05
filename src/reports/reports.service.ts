import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  Prisma,
  ReportModule,
  ReportStatus,
  ReservationStatus,
} from '../../generated/prisma/client/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CompaniesService } from '../companies/companies.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsDto } from './dto/list-reports.dto';
import {
  PaginatedReports,
  ReportResult,
  ReportSummary,
} from './interfaces/report-summary.interface';

const MAX_ROWS = 1000;

const REVENUE_STATUSES: ReservationStatus[] = [
  ReservationStatus.CONFIRMED,
  ReservationStatus.COMPLETED,
];

@Injectable()
export class ReportsService implements OnModuleInit {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly companiesService: CompaniesService,
  ) {}

  async onModuleInit(): Promise<void> {
    const interrupted = await this.prismaService.report.updateMany({
      where: {
        status: { in: [ReportStatus.PENDING, ReportStatus.PROCESSING] },
      },
      data: {
        status: ReportStatus.FAILED,
        error: 'Processamento interrompido antes da conclusão.',
        completedAt: new Date(),
      },
    });

    if (interrupted.count > 0) {
      this.logger.warn(
        `${interrupted.count} relatório(s) marcados como falha após reinício.`,
      );
    }
  }

  async create(
    authenticatedUser: AuthenticatedUser,
    createReportDto: CreateReportDto,
  ): Promise<ReportSummary> {
    const company = await this.companiesService.findCompanyByUserId(
      authenticatedUser.sub,
    );
    const startDate = createReportDto.startDate
      ? new Date(createReportDto.startDate)
      : null;
    const endDate = createReportDto.endDate
      ? new Date(createReportDto.endDate)
      : null;

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'A data inicial deve ser anterior à data final.',
      );
    }

    const report = await this.prismaService.report.create({
      data: {
        companyId: company.id,
        module: createReportDto.module,
        status: ReportStatus.PENDING,
        filters: this.extractFilters(createReportDto),
        startDate,
        endDate,
      },
    });

    setImmediate(() => {
      this.process(report.id).catch((error: unknown) => {
        this.logger.error(
          `Falha ao processar relatório ${report.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
    });

    return this.toSummary(report);
  }

  async findForCompany(
    authenticatedUser: AuthenticatedUser,
    listReportsDto: ListReportsDto,
  ): Promise<PaginatedReports> {
    const company = await this.companiesService.findCompanyByUserId(
      authenticatedUser.sub,
    );
    const { page, pageSize } = listReportsDto;
    const where: Prisma.ReportWhereInput = {
      companyId: company.id,
      module: listReportsDto.module,
      status: listReportsDto.status,
    };

    const [total, reports] = await Promise.all([
      this.prismaService.report.count({ where }),
      this.prismaService.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: reports.map((report) => this.toSummary(report, false)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findOne(
    authenticatedUser: AuthenticatedUser,
    reportId: string,
  ): Promise<ReportSummary> {
    const company = await this.companiesService.findCompanyByUserId(
      authenticatedUser.sub,
    );
    const report = await this.prismaService.report.findFirst({
      where: { id: reportId, companyId: company.id },
    });

    if (!report) {
      throw new NotFoundException('Relatório não encontrado.');
    }

    return this.toSummary(report);
  }

  async process(reportId: string): Promise<void> {
    const report = await this.prismaService.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.PROCESSING },
    });

    try {
      const result = await this.generate(report);

      await this.prismaService.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.COMPLETED,
          result: result as unknown as Prisma.InputJsonValue,
          rowCount: result.rows.length,
          error: null,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Falha ao gerar relatório ${reportId}`,
        error instanceof Error ? error.stack : String(error),
      );

      await this.prismaService.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.FAILED,
          error:
            error instanceof Error ? error.message : 'Erro ao gerar relatório.',
          completedAt: new Date(),
        },
      });
    }
  }

  private async generate(report: {
    companyId: string;
    module: ReportModule;
    filters: Prisma.JsonValue;
    startDate: Date | null;
    endDate: Date | null;
  }): Promise<ReportResult> {
    const filters = (report.filters ?? {}) as Record<string, unknown>;
    const period = this.buildPeriod(report.startDate, report.endDate);

    switch (report.module) {
      case ReportModule.RESERVATIONS:
        return this.generateReservations(report.companyId, filters, period);
      case ReportModule.TRANSACTIONS:
        return this.generateTransactions(report.companyId, filters, period);
      case ReportModule.REVIEWS:
        return this.generateReviews(report.companyId, filters, period);
      case ReportModule.UNITS:
        return this.generateUnits(report.companyId, period);
    }
  }

  private async generateReservations(
    companyId: string,
    filters: Record<string, unknown>,
    period: Prisma.DateTimeFilter | undefined,
  ): Promise<ReportResult> {
    const reservations = await this.prismaService.reservation.findMany({
      where: {
        unit: {
          companyId,
          id: filters.unitId as string | undefined,
        },
        status: filters.reservationStatus as never,
        startTime: period,
      },
      include: {
        unit: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { startTime: 'desc' },
      take: MAX_ROWS + 1,
    });

    const visibleReservations = reservations.slice(0, MAX_ROWS);
    const rows = visibleReservations.map((reservation) => ({
      id: reservation.id,
      unidade: reservation.unit.name,
      cliente: reservation.customer.name,
      inicio: reservation.startTime.toISOString(),
      fim: reservation.endTime.toISOString(),
      status: reservation.status,
      valor: reservation.totalPrice.toString(),
    }));
    const billableReservations = visibleReservations.filter((reservation) =>
      REVENUE_STATUSES.includes(reservation.status),
    );
    const revenue = billableReservations.reduce(
      (sum, reservation) => sum + Number(reservation.totalPrice),
      0,
    );

    return {
      summary: {
        total: rows.length,
        receita: revenue.toFixed(2),
        ticketMedio: billableReservations.length
          ? (revenue / billableReservations.length).toFixed(2)
          : '0.00',
      },
      columns: ['unidade', 'cliente', 'inicio', 'fim', 'status', 'valor'],
      rows,
      truncated: reservations.length > MAX_ROWS,
    };
  }

  private async generateTransactions(
    companyId: string,
    filters: Record<string, unknown>,
    period: Prisma.DateTimeFilter | undefined,
  ): Promise<ReportResult> {
    const transactions = await this.prismaService.transaction.findMany({
      where: {
        OR: [{ companyId }, { reservation: { unit: { companyId } } }],
        status: filters.transactionStatus as never,
        type: filters.transactionType as never,
        createdAt: period,
      },
      include: {
        customer: { select: { name: true } },
        reservation: { select: { unit: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_ROWS + 1,
    });

    const rows = transactions.slice(0, MAX_ROWS).map((transaction) => ({
      id: transaction.id,
      cliente: transaction.customer.name,
      tipo: transaction.type,
      status: transaction.status,
      valor: transaction.amount.toString(),
      reserva: transaction.reservation?.unit.name ?? 'Sem reserva',
      criadaEm: transaction.createdAt.toISOString(),
    }));
    const total = rows.reduce((sum, row) => sum + Number(row.valor), 0);
    const completed = rows.filter((row) => row.status === 'COMPLETED');

    return {
      summary: {
        total: rows.length,
        valorTotal: total.toFixed(2),
        valorConcluido: completed
          .reduce((sum, row) => sum + Number(row.valor), 0)
          .toFixed(2),
      },
      columns: ['cliente', 'tipo', 'status', 'valor', 'reserva', 'criadaEm'],
      rows,
      truncated: transactions.length > MAX_ROWS,
    };
  }

  private async generateReviews(
    companyId: string,
    filters: Record<string, unknown>,
    period: Prisma.DateTimeFilter | undefined,
  ): Promise<ReportResult> {
    const reviews = await this.prismaService.review.findMany({
      where: {
        unit: {
          companyId,
          id: filters.unitId as string | undefined,
        },
        rating:
          filters.minRating === undefined
            ? undefined
            : { gte: Number(filters.minRating) },
        createdAt: period,
      },
      include: {
        unit: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_ROWS + 1,
    });

    const rows = reviews.slice(0, MAX_ROWS).map((review) => ({
      id: review.id,
      unidade: review.unit.name,
      cliente: review.customer.name,
      nota: review.rating,
      comentario: review.comment,
      criadaEm: review.createdAt.toISOString(),
    }));
    const average = rows.length
      ? rows.reduce((sum, row) => sum + row.nota, 0) / rows.length
      : 0;

    return {
      summary: {
        total: rows.length,
        notaMedia: average.toFixed(2),
      },
      columns: ['unidade', 'cliente', 'nota', 'comentario', 'criadaEm'],
      rows,
      truncated: reviews.length > MAX_ROWS,
    };
  }

  private async generateUnits(
    companyId: string,
    period: Prisma.DateTimeFilter | undefined,
  ): Promise<ReportResult> {
    const units = await this.prismaService.unit.findMany({
      where: { companyId },
      include: {
        category: { select: { name: true } },
        reservations: {
          where: { startTime: period },
          select: { totalPrice: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
      take: MAX_ROWS + 1,
    });

    const rows = units.slice(0, MAX_ROWS).map((unit) => {
      const revenue = unit.reservations.reduce(
        (sum, reservation) => sum + Number(reservation.totalPrice),
        0,
      );

      return {
        id: unit.id,
        unidade: unit.name,
        categoria: unit.category.name,
        cidade: `${unit.city}/${unit.state}`,
        precoHora: unit.pricePerHour.toString(),
        reservas: unit.reservations.length,
        receita: revenue.toFixed(2),
      };
    });

    return {
      summary: {
        total: rows.length,
        reservas: rows.reduce((sum, row) => sum + row.reservas, 0),
        receita: rows
          .reduce((sum, row) => sum + Number(row.receita), 0)
          .toFixed(2),
      },
      columns: [
        'unidade',
        'categoria',
        'cidade',
        'precoHora',
        'reservas',
        'receita',
      ],
      rows,
      truncated: units.length > MAX_ROWS,
    };
  }

  private buildPeriod(
    startDate: Date | null,
    endDate: Date | null,
  ): Prisma.DateTimeFilter | undefined {
    if (!startDate && !endDate) {
      return undefined;
    }

    return {
      gte: startDate ?? undefined,
      lte: endDate ?? undefined,
    };
  }

  private extractFilters(
    createReportDto: CreateReportDto,
  ): Prisma.InputJsonValue {
    const { module, startDate, endDate, ...filters } = createReportDto;
    void module;
    void startDate;
    void endDate;

    return Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined),
    ) as Prisma.InputJsonValue;
  }

  private toSummary(
    report: {
      id: string;
      companyId: string;
      module: ReportModule;
      status: ReportStatus;
      filters: Prisma.JsonValue;
      startDate: Date | null;
      endDate: Date | null;
      rowCount: number | null;
      result: Prisma.JsonValue;
      error: string | null;
      createdAt: Date;
      updatedAt: Date;
      completedAt: Date | null;
    },
    includeResult = true,
  ): ReportSummary {
    return {
      id: report.id,
      companyId: report.companyId,
      module: report.module,
      status: report.status,
      filters: (report.filters ?? {}) as Record<string, unknown>,
      startDate: report.startDate,
      endDate: report.endDate,
      rowCount: report.rowCount,
      result: includeResult
        ? ((report.result ?? null) as ReportResult | null)
        : null,
      error: report.error,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      completedAt: report.completedAt,
    };
  }
}
