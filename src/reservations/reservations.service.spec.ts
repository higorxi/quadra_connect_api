/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument -- mocks do Jest são tipados como any */
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  Prisma,
  ReservationStatus,
} from '../../generated/prisma/client/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ProfileType } from '../common/enums/profile-type.enum';
import { CompaniesService } from '../companies/companies.service';
import { CustomersService } from '../customers/customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationsService } from './reservations.service';

const UNIT_ID = '11111111-1111-4111-8111-111111111111';
const CUSTOMER_ID = 'customer-1';

const customerUser = {
  sub: 'user-customer',
  email: 'cliente@teste.com',
  profileType: ProfileType.CUSTOMER,
} as AuthenticatedUser;

const companyUser = {
  sub: 'user-company',
  email: 'locador@teste.com',
  profileType: ProfileType.COMPANY,
} as AuthenticatedUser;

function buildReservationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'reservation-1',
    customerId: CUSTOMER_ID,
    unitId: UNIT_ID,
    customer: { name: 'Cliente' },
    unit: { name: 'Quadra 1', companyId: 'company-1' },
    startTime: new Date('2026-12-01T18:00:00.000Z'),
    endTime: new Date('2026-12-01T19:00:00.000Z'),
    status: ReservationStatus.CONFIRMED,
    totalPrice: new Prisma.Decimal(100),
    bailPaid: false,
    isSplit: false,
    createdAt: new Date('2026-11-01T10:00:00.000Z'),
    updatedAt: new Date('2026-11-01T10:00:00.000Z'),
    ...overrides,
  };
}

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: {
    unit: { findUnique: jest.Mock };
    reservation: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let customersService: { findByUserIdOrThrow: jest.Mock };
  let companiesService: { findCompanyByUserId: jest.Mock };

  const unit = {
    id: UNIT_ID,
    companyId: 'company-1',
    name: 'Quadra 1',
    pricePerHour: new Prisma.Decimal(100),
    requiresConfirmation: false,
  };

  beforeEach(async () => {
    prisma = {
      unit: { findUnique: jest.fn().mockResolvedValue(unit) },
      reservation: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    customersService = {
      findByUserIdOrThrow: jest.fn().mockResolvedValue({ id: CUSTOMER_ID }),
    };
    companiesService = {
      findCompanyByUserId: jest.fn().mockResolvedValue({ id: 'company-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: CustomersService, useValue: customersService },
        { provide: CompaniesService, useValue: companiesService },
      ],
    }).compile();

    service = module.get(ReservationsService);
  });

  describe('create', () => {
    const dto = {
      unitId: UNIT_ID,
      startTime: '2026-12-01T18:00:00.000Z',
      endTime: '2026-12-01T19:30:00.000Z',
    };

    it('cria reserva confirmada e calcula o preço pelo tempo (1,5h x R$100)', async () => {
      prisma.reservation.create.mockImplementation(({ data }) =>
        Promise.resolve(buildReservationRow(data)),
      );

      const result = await service.create(customerUser, dto);

      const createArgs = prisma.reservation.create.mock.calls[0][0];
      expect(createArgs.data.status).toBe(ReservationStatus.CONFIRMED);
      expect(createArgs.data.totalPrice).toBe(150);
      expect(createArgs.data.customerId).toBe(CUSTOMER_ID);
      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('cria reserva PENDING quando a unidade exige confirmação', async () => {
      prisma.unit.findUnique.mockResolvedValue({
        ...unit,
        requiresConfirmation: true,
      });
      prisma.reservation.create.mockImplementation(({ data }) =>
        Promise.resolve(buildReservationRow(data)),
      );

      await service.create(customerUser, dto);

      expect(prisma.reservation.create.mock.calls[0][0].data.status).toBe(
        ReservationStatus.PENDING,
      );
    });

    it('rejeita reserva em horário já ocupado (conflito) e não grava', async () => {
      prisma.reservation.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(customerUser, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });

    it('consulta conflito apenas com reservas PENDING/CONFIRMED que se sobrepõem', async () => {
      prisma.reservation.create.mockImplementation(({ data }) =>
        Promise.resolve(buildReservationRow(data)),
      );

      await service.create(customerUser, dto);

      const where = prisma.reservation.findFirst.mock.calls[0][0].where;
      expect(where.unitId).toBe(UNIT_ID);
      expect(where.status.in).toEqual([
        ReservationStatus.PENDING,
        ReservationStatus.CONFIRMED,
      ]);
      expect(where.startTime).toEqual({ lt: new Date(dto.endTime) });
      expect(where.endTime).toEqual({ gt: new Date(dto.startTime) });
    });

    it('rejeita quando a unidade não existe', async () => {
      prisma.unit.findUnique.mockResolvedValue(null);

      await expect(service.create(customerUser, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejeita data final menor ou igual à inicial', async () => {
      await expect(
        service.create(customerUser, {
          ...dto,
          endTime: dto.startTime,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });

    it('rejeita datas inválidas', async () => {
      await expect(
        service.create(customerUser, { ...dto, startTime: 'invalida' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update (cancelamento)', () => {
    const existing = () =>
      buildReservationRow({ unit: { ...unit, companyId: 'company-1' } });

    it('permite ao cliente cancelar a própria reserva', async () => {
      prisma.reservation.findUnique.mockResolvedValue(existing());
      prisma.reservation.update.mockResolvedValue(
        buildReservationRow({ status: ReservationStatus.CANCELLED }),
      );

      const result = await service.update(customerUser, 'reservation-1', {
        status: ReservationStatus.CANCELLED,
      });

      expect(prisma.reservation.update.mock.calls[0][0].data.status).toBe(
        ReservationStatus.CANCELLED,
      );
      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it('impede o cliente de cancelar reserva de outro cliente', async () => {
      prisma.reservation.findUnique.mockResolvedValue(
        buildReservationRow({ customerId: 'outro-cliente' }),
      );

      await expect(
        service.update(customerUser, 'reservation-1', {
          status: ReservationStatus.CANCELLED,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.reservation.update).not.toHaveBeenCalled();
    });

    it('impede o cliente de definir status diferente de CANCELLED', async () => {
      prisma.reservation.findUnique.mockResolvedValue(existing());

      await expect(
        service.update(customerUser, 'reservation-1', {
          status: ReservationStatus.CONFIRMED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('permite ao locador da unidade confirmar a reserva', async () => {
      prisma.reservation.findUnique.mockResolvedValue(existing());
      prisma.reservation.update.mockResolvedValue(buildReservationRow());

      await service.update(companyUser, 'reservation-1', {
        status: ReservationStatus.CONFIRMED,
      });

      expect(prisma.reservation.update).toHaveBeenCalled();
    });

    it('impede locador de outra empresa de alterar a reserva', async () => {
      prisma.reservation.findUnique.mockResolvedValue(existing());
      companiesService.findCompanyByUserId.mockResolvedValue({
        id: 'company-2',
      });

      await expect(
        service.update(companyUser, 'reservation-1', {
          status: ReservationStatus.CANCELLED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('retorna 404 quando a reserva não existe', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(
        service.update(customerUser, 'inexistente', {
          status: ReservationStatus.CANCELLED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('bloqueia cliente que não é dono da reserva', async () => {
      prisma.reservation.findUnique.mockResolvedValue(
        buildReservationRow({ customerId: 'outro-cliente' }),
      );

      await expect(
        service.findOne(customerUser, 'reservation-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('retorna a reserva ao dono', async () => {
      prisma.reservation.findUnique.mockResolvedValue(buildReservationRow());

      const result = await service.findOne(customerUser, 'reservation-1');

      expect(result.id).toBe('reservation-1');
      expect(result.totalPrice).toBe('100');
    });
  });
});
