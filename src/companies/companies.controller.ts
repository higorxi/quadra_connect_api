import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.companiesService.findMine(user);
  }

  @Patch('me')
  async updateMine(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateMine(user, updateCompanyDto);
  }
}
