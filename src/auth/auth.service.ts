import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileType } from '../common/enums/profile-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterUserDto): Promise<AuthResponseDto> {
    this.validateRegisterPayload(registerDto);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email já está em uso.');
    }

    const passwordHash = await hash(registerDto.password, 10);
    const role = this.mapProfileTypeToRole(registerDto.profileType);

    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: registerDto.email,
          password: passwordHash,
          role,
        },
      });

      if (registerDto.profileType === ProfileType.COMPANY) {
        const company = registerDto.company;

        if (!company) {
          throw new BadRequestException('Dados da company são obrigatórios.');
        }

        await tx.company.create({
          data: {
            userId: user.id,
            name: company.name,
            cnpj: company.cnpj,
            phone: company.phone,
            description: company.description,
          },
        });
      } else {
        const customer = registerDto.customer;

        if (!customer) {
          throw new BadRequestException('Dados do customer são obrigatórios.');
        }

        await tx.customer.create({
          data: {
            userId: user.id,
            name: customer.name,
            cpf: customer.cpf,
            phone: customer.phone,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          company: true,
          customer: true,
        },
      });
    });

    if (!created) {
      throw new NotFoundException('Usuário recém-criado não foi encontrado.');
    }

    return this.buildAuthResponse(created);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        company: true,
        customer: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatches = await compare(loginDto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.buildAuthResponse(user);
  }

  async me(authenticatedUser: AuthenticatedUser): Promise<AuthResponseDto['user']> {
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUser.sub },
      include: {
        company: true,
        customer: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.buildAuthResponse(user).user;
  }

  private buildAuthResponse(user: {
    id: string;
    email: string | null;
    role: UserRole;
    company?: { id: string } | null;
    customer?: { id: string } | null;
  }): AuthResponseDto {
    const profileType = this.mapRoleToProfileType(user.role);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email ?? '',
      role: user.role,
      profileType,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profileType,
        companyId: user.company?.id ?? null,
        customerId: user.customer?.id ?? null,
      },
    };
  }

  private mapProfileTypeToRole(profileType: ProfileType): UserRole {
    if (profileType === ProfileType.COMPANY) {
      return UserRole.LOCATOR;
    }

    return UserRole.CUSTOMER;
  }

  private mapRoleToProfileType(role: UserRole): ProfileType {
    if (role === UserRole.LOCATOR) {
      return ProfileType.COMPANY;
    }

    return ProfileType.CUSTOMER;
  }

  private validateRegisterPayload(registerDto: RegisterUserDto): void {
    if (!registerDto.email || !registerDto.password || !registerDto.profileType) {
      throw new BadRequestException(
        'email, password e profileType são obrigatórios.',
      );
    }

    if (registerDto.profileType === ProfileType.COMPANY && !registerDto.company) {
      throw new BadRequestException('Dados da company são obrigatórios.');
    }

    if (
      registerDto.profileType === ProfileType.CUSTOMER &&
      !registerDto.customer
    ) {
      throw new BadRequestException('Dados do customer são obrigatórios.');
    }
  }
}
