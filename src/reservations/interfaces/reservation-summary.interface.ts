import { ReservationStatus } from '../../../generated/prisma/client/client';

export interface ReservationSummary {
  id: string;
  customerId: string;
  unitId: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
  totalPrice: string;
  bailPaid: boolean;
  isSplit: boolean;
  createdAt: Date;
  updatedAt: Date;
}
