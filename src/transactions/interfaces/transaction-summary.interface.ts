import {
  TransactionStatus,
  TransactionType,
} from '../../../generated/prisma/client/client';

export interface TransactionSummary {
  id: string;
  customerId: string;
  customerName: string | null;
  companyId: string | null;
  reservationId: string | null;
  reservationUnitName: string | null;
  reservationStartTime: Date | null;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  pixCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}
