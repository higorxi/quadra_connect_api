import { Injectable } from '@nestjs/common';
import {
  Prisma,
  ReservationStatus,
} from '../../generated/prisma/client/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CompaniesService } from '../companies/companies.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CompanyStatistics,
  CompanyTopUnitStatistics,
} from './interfaces/company-statistics.interface';

@Injectable()
export class StatisticsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly companiesService: CompaniesService,
  ) {}

  async getCompanyStatistics(
    authenticatedUser: AuthenticatedUser,
  ): Promise<CompanyStatistics> {
    const company = await this.companiesService.findCompanyByUserId(
      authenticatedUser.sub,
    );
    const companyReservationWhere = {
      unit: {
        companyId: company.id,
      },
    };
    const revenueStatuses = [
      ReservationStatus.CONFIRMED,
      ReservationStatus.COMPLETED,
    ];

    const [
      unitsCount,
      reservationsCount,
      upcomingReservationsCount,
      reservationsByStatus,
      revenueAggregate,
      reviewsAggregate,
      topUnitGroups,
    ] = await Promise.all([
      this.prismaService.unit.count({
        where: { companyId: company.id },
      }),
      this.prismaService.reservation.count({
        where: companyReservationWhere,
      }),
      this.prismaService.reservation.count({
        where: {
          ...companyReservationWhere,
          startTime: { gte: new Date() },
          status: {
            in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
          },
        },
      }),
      this.prismaService.reservation.groupBy({
        by: ['status'],
        where: companyReservationWhere,
        _count: {
          _all: true,
        },
      }),
      this.prismaService.reservation.aggregate({
        where: {
          ...companyReservationWhere,
          status: {
            in: revenueStatuses,
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),
      this.prismaService.review.aggregate({
        where: {
          unit: {
            companyId: company.id,
          },
        },
        _count: {
          _all: true,
        },
        _avg: {
          rating: true,
        },
      }),
      this.prismaService.reservation.groupBy({
        by: ['unitId'],
        where: companyReservationWhere,
        _count: {
          _all: true,
        },
        orderBy: {
          _count: {
            unitId: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    const topUnitsByReservations =
      await this.resolveTopUnitsByReservations(topUnitGroups);

    return {
      companyId: company.id,
      companyName: company.name,
      units: {
        total: unitsCount,
      },
      reservations: {
        total: reservationsCount,
        upcoming: upcomingReservationsCount,
        byStatus: this.buildReservationStatusCounts(reservationsByStatus),
      },
      revenue: {
        estimated: this.toMoneyString(revenueAggregate._sum.totalPrice),
      },
      reviews: {
        total: reviewsAggregate._count._all,
        averageRating: Number((reviewsAggregate._avg.rating ?? 0).toFixed(2)),
      },
      topUnitsByReservations,
    };
  }

  private buildReservationStatusCounts(
    reservationsByStatus: {
      status: ReservationStatus;
      _count: {
        _all: number;
      };
    }[],
  ): Record<ReservationStatus, number> {
    const statusCounts = Object.values(ReservationStatus).reduce(
      (accumulator, status) => ({
        ...accumulator,
        [status]: 0,
      }),
      {} as Record<ReservationStatus, number>,
    );

    reservationsByStatus.forEach((reservationStatus) => {
      statusCounts[reservationStatus.status] = reservationStatus._count._all;
    });

    return statusCounts;
  }

  private async resolveTopUnitsByReservations(
    topUnitGroups: {
      unitId: string;
      _count: {
        _all: number;
      };
    }[],
  ): Promise<CompanyTopUnitStatistics[]> {
    const unitIds = topUnitGroups.map((unit) => unit.unitId);

    if (!unitIds.length) {
      return [];
    }

    const units = await this.prismaService.unit.findMany({
      where: {
        id: {
          in: unitIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
    const unitsById = new Map(units.map((unit) => [unit.id, unit]));

    return topUnitGroups.map((unitGroup) => ({
      unitId: unitGroup.unitId,
      name: unitsById.get(unitGroup.unitId)?.name ?? 'Unidade removida',
      reservationsCount: unitGroup._count._all,
    }));
  }

  private toMoneyString(value: Prisma.Decimal | null): string {
    return (value ?? new Prisma.Decimal(0)).toFixed(2);
  }
}
