import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ReservationStatus } from '../../../generated/prisma/client/client';

export class UpdateReservationDto {
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsBoolean()
  bailPaid?: boolean;
}
