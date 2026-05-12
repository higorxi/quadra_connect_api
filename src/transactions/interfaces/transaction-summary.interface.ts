import {
  TransactionStatus,
  TransactionType,
} from '../../../generated/prisma/client/client';

export interface TransactionSummary {
  id: string;
  customerId: string;
  companyId: string | null;
  reservationId: string | null;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  pixCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}
