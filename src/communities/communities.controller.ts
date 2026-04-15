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
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { JoinCommunityDto } from './dto/join-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@Controller('communities')
@UseGuards(JwtAuthGuard, ProfileAccessGuard)
@AllowedProfiles(ProfileType.CUSTOMER)
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createCommunityDto: CreateCommunityDto,
  ) {
    return this.communitiesService.create(user, createCommunityDto);
  }

  @Post('join')
  async join(
    @CurrentUser() user: AuthenticatedUser,
    @Body() joinCommunityDto: JoinCommunityDto,
  ) {
    return this.communitiesService.join(user, joinCommunityDto);
  }

  @Get('mine')
  async findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.communitiesService.findMine(user);
  }

  @Get('joined')
  async findJoined(@CurrentUser() user: AuthenticatedUser) {
    return this.communitiesService.findJoined(user);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.communitiesService.findOne(user, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateCommunityDto: UpdateCommunityDto,
  ) {
    return this.communitiesService.update(user, id, updateCommunityDto);
  }
}
