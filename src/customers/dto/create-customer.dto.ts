import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(11)
  cpf!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
