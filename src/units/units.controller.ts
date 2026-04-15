import {
  Body,
  Controller,
  Delete,
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
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitsService } from './units.service';

@Controller('units')
@UseGuards(JwtAuthGuard, ProfileAccessGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @AllowedProfiles(ProfileType.COMPANY)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createUnitDto: CreateUnitDto,
  ) {
    return this.unitsService.create(user, createUnitDto);
  }

  @Get()
  async findAll() {
    return this.unitsService.findAll();
  }

  @Get('mine')
  @AllowedProfiles(ProfileType.COMPANY)
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.unitsService.findByCompany(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  @Patch(':id')
  @AllowedProfiles(ProfileType.COMPANY)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateUnitDto: UpdateUnitDto,
  ) {
    return this.unitsService.update(user, id, updateUnitDto);
  }

  @Delete(':id')
  @AllowedProfiles(ProfileType.COMPANY)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.unitsService.remove(user, id);
  }
}
