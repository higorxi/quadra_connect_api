import { IsDateString } from 'class-validator';

export class AvailabilityQueryDto {
  /** Início do período consultado (ISO 8601). */
  @IsDateString()
  from!: string;

  /** Fim do período consultado (ISO 8601). */
  @IsDateString()
  to!: string;
}
