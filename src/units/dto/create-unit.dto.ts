import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateUnitDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  state!: string;

  @IsNumber()
  @Min(0)
  pricePerHour!: number;

  @IsOptional()
  @IsBoolean()
  requiresConfirmation?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bailValue?: number;
}
