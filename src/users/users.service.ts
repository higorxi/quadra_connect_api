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

  async findFirst(args: Prisma.UserFindFirstArgs, db?: UserDbAccessor) {
    const user = await this.userModel(db).findFirst(args);
    return user;
  }

  async findMany(args?: Prisma.UserFindManyArgs, db?: UserDbAccessor) {
    const users = await this.userModel(db).findMany(args);
    return users;
  }

  async create(args: Prisma.UserCreateArgs, db?: UserDbAccessor) {
    const user = await this.userModel(db).create(args);
    return user;
  }

  async update(args: Prisma.UserUpdateArgs, db?: UserDbAccessor) {
    const user = await this.userModel(db).update(args);
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
    const user = await this.create(
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
    const user = await this.findFirst(
      {
        where: { email },
        include: {
          company: true,
          customer: true,
        },
      },
      undefined,
    );

    return user ? this.toSummary(user) : null;
  }

  async findById(id: string): Promise<UserSummary | null> {
    const user = await this.findFirst(
      {
        where: { id },
        include: {
          company: true,
          customer: true,
        },
      },
      undefined,
    );

    return user ? this.toSummary(user) : null;
  }

  createFromUsersModule(createUserDto: CreateUserDto): never {
    throw new BadRequestException(
      `Cadastro de usuário deve ser realizado via endpoint /auth/register (${createUserDto.email}).`,
    );
  }

  async findAll(): Promise<UserSummary[]> {
    const users = await this.findMany({
      include: {
        company: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.toSummary(user));
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
