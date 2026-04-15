import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  unitId!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isSplit?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPrice?: number;

  @IsOptional()
  @IsBoolean()
  bailPaid?: boolean;
}
