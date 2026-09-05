import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  ReportModule,
  ReservationStatus,
  TransactionStatus,
  TransactionType,
} from '../../../generated/prisma/client/client';

export class CreateReportDto {
  @IsEnum(ReportModule)
  module!: ReportModule;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unitId?: string;

  @IsOptional()
  @IsEnum(ReservationStatus)
  reservationStatus?: ReservationStatus;

  @IsOptional()
  @IsEnum(TransactionStatus)
  transactionStatus?: TransactionStatus;

  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  minRating?: number;
}
