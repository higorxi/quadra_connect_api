import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ReservationStatus,
} from '../../generated/prisma/client/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ProfileType } from '../common/enums/profile-type.enum';
import { CompaniesService } from '../companies/companies.service';
import { CustomersService } from '../customers/customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationSummary } from './interfaces/reservation-summary.interface';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly customersService: CustomersService,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(
    authenticatedUser: AuthenticatedUser,
    createReservationDto: CreateReservationDto,
  ): Promise<ReservationSummary> {
    const customer = await this.customersService.findByUserIdOrThrow(
      authenticatedUser.sub,
    );
    const unit = await this.prismaService.unit.findUnique({
      where: { id: createReservationDto.unitId },
    });

    if (!unit) {
      throw new NotFoundException('Unidade não encontrada.');
    }

    const startTime = new Date(createReservationDto.startTime);
    const endTime = new Date(createReservationDto.endTime);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      throw new BadRequestException('Datas da reserva inválidas.');
    }

    if (endTime <= startTime) {
      throw new BadRequestException(
        'A data final deve ser maior que a data inicial.',
      );
    }

    const overlappingReservation =
      await this.prismaService.reservation.findFirst({
        where: {
          unitId: unit.id,
          status: {
            in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
          },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        select: { id: true },
      });

    if (overlappingReservation) {
      throw new BadRequestException(
        'Já existe uma reserva para essa unidade no período informado.',
      );
    }

    const computedTotalPrice = this.computeTotalPrice(
      startTime,
      endTime,
      unit.pricePerHour,
    );
    const totalPrice = createReservationDto.totalPrice ?? computedTotalPrice;

    const reservation = await this.prismaService.reservation.create({
      data: {
        customerId: customer.id,
        unitId: unit.id,
        startTime,
        endTime,
        status: unit.requiresConfirmation
          ? ReservationStatus.PENDING
          : ReservationStatus.CONFIRMED,
        totalPrice,
        bailPaid: createReservationDto.bailPaid ?? false,
        isSplit: createReservationDto.isSplit ?? false,
      },
    });

    return this.toSummary(reservation);
  }

  async findMine(
    authenticatedUser: AuthenticatedUser,
  ): Promise<ReservationSummary[]> {
    const customer = await this.customersService.findByUserIdOrThrow(
      authenticatedUser.sub,
    );
    const reservations = await this.prismaService.reservation.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });

    return reservations.map((reservation) => this.toSummary(reservation));
  }

  async findForCompany(
    authenticatedUser: AuthenticatedUser,
  ): Promise<ReservationSummary[]> {
    const company = await this.companiesService.findCompanyByUserId(
      authenticatedUser.sub,
    );

    const reservations = await this.prismaService.reservation.findMany({
      where: {
        unit: {
          companyId: company.id,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reservations.map((reservation) => this.toSummary(reservation));
  }

  async findOne(
    authenticatedUser: AuthenticatedUser,
    reservationId: string,
  ): Promise<ReservationSummary> {
    const reservation = await this.prismaService.reservation.findUnique({
      where: { id: reservationId },
      include: {
        unit: {
          select: { companyId: true },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    if (authenticatedUser.profileType === ProfileType.CUSTOMER) {
      const customer = await this.customersService.findByUserIdOrThrow(
        authenticatedUser.sub,
      );
      if (reservation.customerId !== customer.id) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar essa reserva.',
        );
      }
    } else {
      const company = await this.companiesService.findCompanyByUserId(
        authenticatedUser.sub,
      );
      if (reservation.unit.companyId !== company.id) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar essa reserva.',
        );
      }
    }

    return this.toSummary(reservation);
  }

  async update(
    authenticatedUser: AuthenticatedUser,
    reservationId: string,
    updateReservationDto: UpdateReservationDto,
  ): Promise<ReservationSummary> {
    const reservation = await this.prismaService.reservation.findUnique({
      where: { id: reservationId },
      include: {
        unit: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    if (authenticatedUser.profileType === ProfileType.CUSTOMER) {
      const customer = await this.customersService.findByUserIdOrThrow(
        authenticatedUser.sub,
      );
      if (reservation.customerId !== customer.id) {
        throw new ForbiddenException('Você não pode alterar essa reserva.');
      }
      if (
        updateReservationDto.status &&
        updateReservationDto.status !== ReservationStatus.CANCELLED
      ) {
        throw new ForbiddenException(
          'Customer só pode cancelar a própria reserva.',
        );
      }
    } else {
      const company = await this.companiesService.findCompanyByUserId(
        authenticatedUser.sub,
      );
      if (reservation.unit.companyId !== company.id) {
        throw new ForbiddenException('Você não pode alterar essa reserva.');
      }
    }

    const updatedReservation = await this.prismaService.reservation.update({
      where: { id: reservationId },
      data: {
        status: updateReservationDto.status,
        bailPaid: updateReservationDto.bailPaid,
      },
    });
    return this.toSummary(updatedReservation);
  }

  private computeTotalPrice(
    startTime: Date,
    endTime: Date,
    pricePerHour: Prisma.Decimal,
  ): number {
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / 1000 / 60 / 60;
    if (durationHours <= 0) {
      throw new BadRequestException('Período da reserva inválido.');
    }
    return Number((durationHours * pricePerHour.toNumber()).toFixed(2));
  }

  private toSummary(reservation: {
    id: string;
    customerId: string;
    unitId: string;
    startTime: Date;
    endTime: Date;
    status: ReservationStatus;
    totalPrice: Prisma.Decimal;
    bailPaid: boolean;
    isSplit: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ReservationSummary {
    return {
      id: reservation.id,
      customerId: reservation.customerId,
      unitId: reservation.unitId,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      status: reservation.status,
      totalPrice: reservation.totalPrice.toString(),
      bailPaid: reservation.bailPaid,
      isSplit: reservation.isSplit,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}
