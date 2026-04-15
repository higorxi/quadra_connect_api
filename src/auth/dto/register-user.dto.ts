import { ProfileType } from '../../common/enums/profile-type.enum';
import { CreateCompanyDto } from '../../companies/dto/create-company.dto';
import { CreateCustomerDto } from '../../customers/dto/create-customer.dto';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterUserDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsEnum(ProfileType)
  profileType!: ProfileType;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCompanyDto)
  company?: CreateCompanyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCustomerDto)
  customer?: CreateCustomerDto;
}
