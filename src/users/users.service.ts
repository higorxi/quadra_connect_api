import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UserSummary, UserWithRelations } from './interfaces/user-summary.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { ProfileType } from '../common/enums/profile-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import {
  CreateUserParams,
  FindFirstUserParams,
  FindManyUsersParams,
  UpdateUserParams,
} from './types/user-params.type';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUser(data: FindFirstUserParams['where']): Promise<UserSummary | null> {
    const user = await this.findFirst({ where: data });
    return user ? this.toSummary(user) : null;
  }

  async getUsersBy(params: FindManyUsersParams): Promise<UserSummary[]> {
    const users = await this.findMany(params);
    return users.map((user) => this.toSummary(user));
  }

  async listUsers(params: FindManyUsersParams): Promise<UserSummary[]> {
    const users = await this.findMany(params);
    return users.map((user) => this.toSummary(user));
  }

  async findFirst(params: FindFirstUserParams) {
    const { where, orderBy, include } = params;
    const user = await this.prismaService.user.findFirst({
      where,
      orderBy,
      include,
    });
    return user;
  }

  async findMany(params: FindManyUsersParams) {
    const { skip, take, cursor, where, orderBy, include } = params;
    const users = await this.prismaService.user.findMany({
      where,
      skip,
      take,
      cursor,
      orderBy,
      include,
    });
    return users;
  }

  async createUser(params: CreateUserParams) {
    const { data, include } = params;
    const user = await this.prismaService.user.create({
      data,
      include,
    });
    return user;
  }

  async updateUser(params: UpdateUserParams) {
    const { where, data, include } = params;
    const user = await this.prismaService.user.update({
      where,
      data,
      include,
    });
    return user;
  }

  async findByEmailWithRelations(
    email: string,
  ): Promise<UserWithRelations | null> {
    const user = await this.findFirst(
      {
        where: { email },
        include: {
          company: true,
          customer: true,
        },
      },
    );

    return user ? this.toWithRelations(user) : null;
  }

  async findByIdWithRelations(
    id: string,
  ): Promise<UserWithRelations | null> {
    const user = await this.findFirst(
      {
        where: { id },
        include: {
          company: true,
          customer: true,
        },
      },
    );

    return user ? this.toWithRelations(user) : null;
  }

  async createAuthUser(
    data: { email: string; password: string; role: UserRole },
  ): Promise<UserWithRelations> {
    const user = await this.createUser(
      {
        data,
        include: {
          company: true,
          customer: true,
        },
      },
    );

    return this.toWithRelations(user);
  }

  async findByEmail(email: string): Promise<UserSummary | null> {
    return this.findUser({ email });
  }

  async findById(id: string): Promise<UserSummary | null> {
    return this.findUser({ id });
  }

  createFromUsersModule(createUserDto: CreateUserDto): never {
    throw new BadRequestException(
      `Cadastro de usuário deve ser realizado via endpoint /auth/register (${createUserDto.email}).`,
    );
  }

  async findAll(): Promise<UserSummary[]> {
    return this.listUsers({
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
        customer: true,
      },
    });
  }

  async findOne(id: string): Promise<UserSummary> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async findMe(authenticatedUser: AuthenticatedUser): Promise<UserSummary> {
    return this.findOne(authenticatedUser.sub);
  }

  private toWithRelations(user: {
    id: string;
    email: string | null;
    role: UserRole;
    password: string;
    company?: { id: string } | null;
    customer?: { id: string } | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserWithRelations {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      password: user.password,
      company: user.company ?? null,
      customer: user.customer ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toSummary(user: {
    id: string;
    email: string | null;
    role: UserRole;
    company?: { id: string } | null;
    customer?: { id: string } | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserSummary {
    return {
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
    };
  }
}
