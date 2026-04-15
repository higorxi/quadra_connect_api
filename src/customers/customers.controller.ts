import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileAccessGuard } from '../auth/guards/profile-access.guard';
import { AllowedProfiles } from '../auth/decorators/allowed-profiles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CustomersService } from './customers.service';
import { ProfileType } from '../common/enums/profile-type.enum';

@UseGuards(JwtAuthGuard, ProfileAccessGuard)
@AllowedProfiles(ProfileType.CUSTOMER)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('me')
  async findOwnProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.findOwnProfile(user);
  }
}
