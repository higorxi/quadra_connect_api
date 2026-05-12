import { ReservationStatus } from '../../../generated/prisma/client/client';

export interface CompanyReviewSummary {
  id: string;
  reservationId: string;
  unitId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  reservation: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: ReservationStatus;
  };
  unit: {
    id: string;
    name: string;
  };
}
