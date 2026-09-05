import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client/client';
import { CompaniesService } from '../companies/companies.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReportResult } from './interfaces/report-summary.interface';
import { ReportsService } from './reports.service';

interface ReportUpdate {
  data: {
    status: string;
    rowCount?: number;
    error?: string;
    result?: ReportResult;
  };
}

interface ReservationQuery {
  where: { status?: string };
}

const pendingReport = {
  id: 'report-1',
  companyId: 'company-1',
  module: 'RESERVATIONS',
  filters: { reservationStatus: 'COMPLETED' },
  startDate: null,
  endDate: null,
};

const reservations = [
  {
    id: 'reservation-1',
    unit: { name: 'Quadra 1' },
    customer: { name: 'João' },
    startTime: new Date('2026-01-01T10:00:00Z'),
    endTime: new Date('2026-01-01T11:00:00Z'),
    status: 'COMPLETED',
    totalPrice: new Prisma.Decimal('100.00'),
  },
  {
    id: 'reservation-2',
    unit: { name: 'Quadra 2' },
    customer: { name: 'Maria' },
    startTime: new Date('2026-01-02T10:00:00Z'),
    endTime: new Date('2026-01-02T11:00:00Z'),
    status: 'CANCELLED',
    totalPrice: new Prisma.Decimal('50.00'),
  },
];

describe('ReportsService', () => {
  let service: ReportsService;
  let updates: ReportUpdate[];
  let reservationQueries: ReservationQuery[];
  let findManyMock: jest.Mock;

  beforeEach(async () => {
    updates = [];
    reservationQueries = [];
    findManyMock = jest.fn((args: ReservationQuery) => {
      reservationQueries.push(args);
      return Promise.resolve(reservations);
    });

    const prisma = {
      report: {
        update: jest.fn((args: ReportUpdate) => {
          updates.push(args);
          return Promise.resolve(pendingReport);
        }),
      },
      reservation: { findMany: findManyMock },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: CompaniesService,
          useValue: { findCompanyByUserId: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('gera o relatório de reservas somando receita só das reservas válidas', async () => {
    await service.process('report-1');

    expect(updates[1].data.status).toBe('COMPLETED');
    expect(updates[1].data.rowCount).toBe(2);
    expect(updates[1].data.result?.summary).toEqual({
      total: 2,
      receita: '100.00',
      ticketMedio: '100.00',
    });
    expect(reservationQueries[0].where.status).toBe('COMPLETED');
  });

  it('marca como FAILED quando a geração quebra', async () => {
    findManyMock.mockRejectedValueOnce(new Error('boom'));

    await service.process('report-1');

    expect(updates[1].data.status).toBe('FAILED');
    expect(updates[1].data.error).toBe('boom');
  });
});
