import { IsEnum } from 'class-validator';
import { TransactionStatus } from '../../../generated/prisma/client/client';

export class UpdateTransactionStatusDto {
  @IsEnum(TransactionStatus)
  status!: TransactionStatus;
}
