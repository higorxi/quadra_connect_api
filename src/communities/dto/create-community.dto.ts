import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
