import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AllowedProfiles } from '../auth/decorators/allowed-profiles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileAccessGuard } from '../auth/guards/profile-access.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ProfileType } from '../common/enums/profile-type.enum';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
@UseGuards(JwtAuthGuard, ProfileAccessGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @AllowedProfiles(ProfileType.CUSTOMER)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createReservationDto: CreateReservationDto,
  ) {
    return this.reservationsService.create(user, createReservationDto);
  }

  @Get('mine')
  @AllowedProfiles(ProfileType.CUSTOMER)
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.findMine(user);
  }

  @Get('company')
  @AllowedProfiles(ProfileType.COMPANY)
  async findForCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.reservationsService.findForCompany(user);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.reservationsService.findOne(user, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(user, id, updateReservationDto);
  }
}
