import {
  TransactionStatus,
  TransactionType,
} from '../../../generated/prisma/client/client';

export interface TransactionSummary {
  id: string;
  customerId: string;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  pixCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}
