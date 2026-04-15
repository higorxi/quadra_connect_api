import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileAccessGuard } from '../auth/guards/profile-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AllowedProfiles } from '../auth/decorators/allowed-profiles.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ProfileType } from '../common/enums/profile-type.enum';

@Controller('companies')
@UseGuards(JwtAuthGuard, ProfileAccessGuard)
@AllowedProfiles(ProfileType.COMPANY)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  async findCompanyByUserId(@CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.findCompanyByUserId(user.sub);
  }

  @Patch('me')
  async updateMine(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateCompanyByUserId(user.sub, updateCompanyDto);
  }
}
