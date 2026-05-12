import { Controller, Get, UseGuards } from '@nestjs/common';
import { AllowedProfiles } from '../auth/decorators/allowed-profiles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileAccessGuard } from '../auth/guards/profile-access.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ProfileType } from '../common/enums/profile-type.enum';
import { CompanyStatistics } from './interfaces/company-statistics.interface';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
@UseGuards(JwtAuthGuard, ProfileAccessGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('company')
  @AllowedProfiles(ProfileType.COMPANY)
  async getCompanyStatistics(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CompanyStatistics> {
    return this.statisticsService.getCompanyStatistics(user);
  }
}
