import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CustomerEntity } from './entities/customer.entity';
import { ProfileType } from '../common/enums/profile-type.enum';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOwnProfile(authenticatedUser: AuthenticatedUser): Promise<CustomerEntity> {
    if (authenticatedUser.profileType !== ProfileType.CUSTOMER) {
      throw new ForbiddenException(
        'Apenas usuários customer podem acessar este endpoint.',
      );
    }

    const customer = await this.prisma.customer.findUnique({
      where: { userId: authenticatedUser.sub },
    });

    if (!customer) {
      throw new NotFoundException('Customer não encontrado para este usuário.');
    }

    return new CustomerEntity(customer);
  }
}
