import { ReservationStatus } from '../../../generated/prisma/client/client';

export interface CompanyTopUnitStatistics {
  unitId: string;
  name: string;
  reservationsCount: number;
}

export interface CompanyStatistics {
  companyId: string;
  companyName: string;
  units: {
    total: number;
  };
  reservations: {
    total: number;
    upcoming: number;
    byStatus: Record<ReservationStatus, number>;
  };
  revenue: {
    estimated: string;
  };
  reviews: {
    total: number;
    averageRating: number;
  };
  topUnitsByReservations: CompanyTopUnitStatistics[];
}
