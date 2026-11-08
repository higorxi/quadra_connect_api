import { ReservationStatus } from '../../../generated/prisma/client/client';

export interface BusySlot {
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
}

export interface UnitAvailability {
  unitId: string;
  from: Date;
  to: Date;
  /** Intervalos já ocupados (reservas PENDING ou CONFIRMED) no período. */
  busy: BusySlot[];
}
