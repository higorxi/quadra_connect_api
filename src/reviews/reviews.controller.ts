import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AllowedProfiles } from '../auth/decorators/allowed-profiles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileAccessGuard } from '../auth/guards/profile-access.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ProfileType } from '../common/enums/profile-type.enum';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(JwtAuthGuard, ProfileAccessGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @AllowedProfiles(ProfileType.CUSTOMER)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user, createReviewDto);
  }

  @Get('reservation/:reservationId')
  async findByReservation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reservationId') reservationId: string,
  ) {
    return this.reviewsService.findByReservation(user, reservationId);
  }
}
