import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ProfileType } from '../common/enums/profile-type.enum';
import { CompaniesService } from '../companies/companies.service';
import { CustomersService } from '../customers/customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewSummary } from './interfaces/review-summary.interface';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly customersService: CustomersService,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(
    authenticatedUser: AuthenticatedUser,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewSummary> {
    const customer = await this.customersService.findByUserIdOrThrow(
      authenticatedUser.sub,
    );

    const reservation = await this.prismaService.reservation.findUnique({
      where: { id: createReviewDto.reservationId },
      include: {
        review: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    if (reservation.customerId !== customer.id) {
      throw new ForbiddenException(
        'Você só pode avaliar reservas realizadas por você.',
      );
    }

    if (reservation.review) {
      throw new BadRequestException('Essa reserva já possui avaliação.');
    }

    const review = await this.prismaService.review.create({
      data: {
        reservationId: reservation.id,
        customerId: customer.id,
        unitId: reservation.unitId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
      },
    });

    return this.toSummary(review);
  }

  async findByReservation(
    authenticatedUser: AuthenticatedUser,
    reservationId: string,
  ): Promise<ReviewSummary | null> {
    const reservation = await this.prismaService.reservation.findUnique({
      where: { id: reservationId },
      include: {
        unit: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    let canAccess = false;

    if (authenticatedUser.profileType === ProfileType.CUSTOMER) {
      const customer = await this.customersService.findByUserIdOrThrow(
        authenticatedUser.sub,
      );
      canAccess = reservation.customerId === customer.id;
    }

    if (authenticatedUser.profileType === ProfileType.COMPANY) {
      const company = await this.companiesService.findCompanyByUserId(
        authenticatedUser.sub,
      );
      canAccess = reservation.unit.companyId === company.id;
    }

    if (!canAccess) {
      throw new ForbiddenException('Você não tem acesso a essa avaliação.');
    }

    const review = await this.prismaService.review.findUnique({
      where: { reservationId },
    });

    return review ? this.toSummary(review) : null;
  }

  private toSummary(review: {
    id: string;
    reservationId: string;
    customerId: string;
    unitId: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ReviewSummary {
    return {
      id: review.id,
      reservationId: review.reservationId,
      customerId: review.customerId,
      unitId: review.unitId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
