/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument -- mocks do Jest são tipados como any */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReservationStatus } from '../../generated/prisma/client/client';
import { CompaniesService } from '../companies/companies.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnitsService } from './units.service';

const UNIT_ID = '11111111-1111-4111-8111-111111111111';

describe('UnitsService - findAvailability', () => {
  let service: UnitsService;
  let prisma: {
    unit: { findUnique: jest.Mock };
    reservation: { findMany: jest.Mock };
  };

  const query = {
    from: '2026-12-01T03:00:00.000Z',
    to: '2026-12-02T03:00:00.000Z',
  };

  beforeEach(async () => {
    prisma = {
      unit: { findUnique: jest.fn().mockResolvedValue({ id: UNIT_ID }) },
      reservation: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CompaniesService, useValue: {} },
      ],
    }).compile();

    service = module.get(UnitsService);
  });

  it('retorna os intervalos ocupados do período, ordenados', async () => {
    const busy = [
      {
        startTime: new Date('2026-12-01T18:00:00.000Z'),
        endTime: new Date('2026-12-01T19:00:00.000Z'),
        status: ReservationStatus.CONFIRMED,
      },
    ];
    prisma.reservation.findMany.mockResolvedValue(busy);

    const result = await service.findAvailability(UNIT_ID, query);

    expect(result.unitId).toBe(UNIT_ID);
    expect(result.busy).toEqual(busy);
    expect(prisma.reservation.findMany.mock.calls[0][0].orderBy).toEqual({
      startTime: 'asc',
    });
  });

  it('considera apenas reservas PENDING/CONFIRMED que se sobrepõem ao período', async () => {
    await service.findAvailability(UNIT_ID, query);

    const where = prisma.reservation.findMany.mock.calls[0][0].where;
    expect(where.unitId).toBe(UNIT_ID);
    expect(where.status.in).toEqual([
      ReservationStatus.PENDING,
      ReservationStatus.CONFIRMED,
    ]);
    expect(where.startTime).toEqual({ lt: new Date(query.to) });
    expect(where.endTime).toEqual({ gt: new Date(query.from) });
  });

  it('retorna lista vazia quando a unidade está livre', async () => {
    const result = await service.findAvailability(UNIT_ID, query);

    expect(result.busy).toEqual([]);
  });

  it('retorna 404 quando a unidade não existe', async () => {
    prisma.unit.findUnique.mockResolvedValue(null);

    await expect(service.findAvailability(UNIT_ID, query)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.reservation.findMany).not.toHaveBeenCalled();
  });

  it('rejeita período com fim menor ou igual ao início', async () => {
    await expect(
      service.findAvailability(UNIT_ID, { from: query.to, to: query.from }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejeita período maior que 31 dias', async () => {
    await expect(
      service.findAvailability(UNIT_ID, {
        from: '2026-12-01T00:00:00.000Z',
        to: '2027-02-01T00:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejeita datas inválidas', async () => {
    await expect(
      service.findAvailability(UNIT_ID, { from: 'x', to: 'y' }),
    ).rejects.toThrow(BadRequestException);
  });
});
