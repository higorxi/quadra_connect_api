import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  reservationId!: string;

  @IsInt()
  @Min(0)
  @Max(10)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
