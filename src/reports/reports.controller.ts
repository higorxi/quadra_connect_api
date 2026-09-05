import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AllowedProfiles } from '../auth/decorators/allowed-profiles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileAccessGuard } from '../auth/guards/profile-access.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ProfileType } from '../common/enums/profile-type.enum';
import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsDto } from './dto/list-reports.dto';
import {
  PaginatedReports,
  ReportSummary,
} from './interfaces/report-summary.interface';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, ProfileAccessGuard)
@AllowedProfiles(ProfileType.COMPANY)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createReportDto: CreateReportDto,
  ): Promise<ReportSummary> {
    return this.reportsService.create(user, createReportDto);
  }

  @Get()
  async findForCompany(
    @CurrentUser() user: AuthenticatedUser,
    @Query() listReportsDto: ListReportsDto,
  ): Promise<PaginatedReports> {
    return this.reportsService.findForCompany(user, listReportsDto);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ReportSummary> {
    return this.reportsService.findOne(user, id);
  }
}
