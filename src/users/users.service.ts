import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UserEntity } from './entities/user.entity';
import { UserSummary } from './interfaces/user-summary.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { ProfileType } from '../common/enums/profile-type.enum';
import { UserRole } from 'generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto): never {
    throw new BadRequestException(
      `Cadastro de usuário deve ser realizado via endpoint /auth/register (${createUserDto.email}).`,
    );
  }

  async findAll(): Promise<UserSummary[]> {
    const users = await this.prisma.user.findMany({
      include: {
        company: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(
      (user) =>
        new UserEntity({
          id: user.id,
          email: user.email,
          role: user.role,
          profileType:
            user.role === UserRole.LOCATOR
              ? ProfileType.COMPANY
              : ProfileType.CUSTOMER,
          companyId: user.company?.id ?? null,
          customerId: user.customer?.id ?? null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }),
    );
  }

  async findOne(id: string): Promise<UserSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
        customer: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return new UserEntity({
      id: user.id,
      email: user.email,
      role: user.role,
      profileType:
        user.role === UserRole.LOCATOR
          ? ProfileType.COMPANY
          : ProfileType.CUSTOMER,
      companyId: user.company?.id ?? null,
      customerId: user.customer?.id ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async findMe(authenticatedUser: AuthenticatedUser): Promise<UserSummary> {
    return this.findOne(authenticatedUser.sub);
  }
}
