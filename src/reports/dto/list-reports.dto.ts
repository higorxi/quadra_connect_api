import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  ReportModule,
  ReportStatus,
} from '../../../generated/prisma/client/client';

export class ListReportsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;

  @IsOptional()
  @IsEnum(ReportModule)
  module?: ReportModule;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}
