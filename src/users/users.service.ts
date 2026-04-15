import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client/client';
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

type UserDbAccessor = Pick<PrismaService, 'user'>;
type AuthTransactionAccessor = Pick<PrismaService, 'user' | 'company' | 'customer'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    callback: (db: AuthTransactionAccessor) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return callback(tx as AuthTransactionAccessor);
    });
  }

  async findUser(
    data: Prisma.UserWhereInput,
    db?: UserDbAccessor,
  ): Promise<UserSummary | null> {
    const user = await this.findFirst({ where: data }, db);
    return user ? this.toSummary(user) : null;
  }

  async getUsersBy(
    params: FindManyUsersParams,
    db?: UserDbAccessor,
  ): Promise<UserSummary[]> {
    const users = await this.findMany(params, db);
    return users.map((user) => this.toSummary(user));
  }

  async listUsers(
    params: FindManyUsersParams,
    db?: UserDbAccessor,
  ): Promise<UserSummary[]> {
    const users = await this.findMany(params, db);
    return users.map((user) => this.toSummary(user));
  }

  async findFirst(params: FindFirstUserParams, db?: UserDbAccessor) {
    const { where, orderBy, include } = params;
    const user = await this.userModel(db).findFirst({
      where,
      orderBy,
      include,
    });
    return user;
  }

  async findMany(params: FindManyUsersParams, db?: UserDbAccessor) {
    const { skip, take, cursor, where, orderBy, include } = params;
    const users = await this.userModel(db).findMany({
      where,
      skip,
      take,
      cursor,
      orderBy,
      include,
    });
    return users;
  }

  async createUser(params: CreateUserParams, db?: UserDbAccessor) {
    const { data, include } = params;
    const user = await this.userModel(db).create({
      data,
      include,
    });
    return user;
  }

  async updateUser(params: UpdateUserParams, db?: UserDbAccessor) {
    const { where, data, include } = params;
    const user = await this.userModel(db).update({
      where,
      data,
      include,
    });
    return user;
  }

  async findByEmailWithRelations(
    email: string,
    db?: UserDbAccessor,
  ): Promise<UserWithRelations | null> {
    const user = await this.findFirst(
      {
        where: { email },
        include: {
          company: true,
          customer: true,
        },
      },
      db,
    );

    return user ? this.toWithRelations(user) : null;
  }

  async findByIdWithRelations(
    id: string,
    db?: UserDbAccessor,
  ): Promise<UserWithRelations | null> {
    const user = await this.findFirst(
      {
        where: { id },
        include: {
          company: true,
          customer: true,
        },
      },
      db,
    );

    return user ? this.toWithRelations(user) : null;
  }

  async createAuthUser(
    data: { email: string; password: string; role: UserRole },
    db?: UserDbAccessor,
  ): Promise<UserWithRelations> {
    const user = await this.createUser(
      {
        data,
        include: {
          company: true,
          customer: true,
        },
      },
      db,
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

  private userModel(db?: UserDbAccessor) {
    return db?.user ?? this.prisma.user;
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
