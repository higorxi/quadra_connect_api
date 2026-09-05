import { ReservationStatus } from '../../../generated/prisma/client/client';

export interface ReservationSummary {
  id: string;
  customerId: string;
  customerName: string | null;
  unitId: string;
  unitName: string | null;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
  totalPrice: string;
  bailPaid: boolean;
  isSplit: boolean;
  createdAt: Date;
  updatedAt: Date;
}
