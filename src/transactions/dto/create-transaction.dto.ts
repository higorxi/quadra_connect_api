import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TransactionType } from '../../../generated/prisma/client/client';

export class CreateTransactionDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pixCode?: string;
}
