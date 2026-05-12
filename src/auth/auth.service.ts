import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { ProfileType } from '../common/enums/profile-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import { CustomersService } from '../customers/customers.service';
import { UserWithIncludes } from '../users/interfaces/user-summary.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly companiesService: CompaniesService,
    private readonly customersService: CustomersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterUserDto): Promise<AuthResponseDto> {
    this.validateRegisterPayload(registerDto);

    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new BadRequestException('Email já está em uso.');
    }

    const passwordHash = await hash(registerDto.password, 10);
    const role = this.mapProfileTypeToRole(registerDto.profileType);
    const createdUser = await this.usersService.createAuthUser({
      email: registerDto.email,
      password: passwordHash,
      role,
    });

    if (registerDto.profileType === ProfileType.COMPANY) {
      const company = registerDto.company;

      if (!company) {
        throw new BadRequestException('Dados da company são obrigatórios.');
      }

      await this.companiesService.createCompany({
        userId: createdUser.id,
        name: company.name,
        cnpj: company.cnpj,
        phone: company.phone,
        description: company.description,
      });
    } else {
      const customer = registerDto.customer;

      if (!customer) {
        throw new BadRequestException('Dados do customer são obrigatórios.');
      }

      await this.customersService.createCustomer({
        userId: createdUser.id,
        name: customer.name,
        cpf: customer.cpf,
        phone: customer.phone,
      });
    }

    const created = await this.usersService.findByIdWithRelations(
      createdUser.id,
    );

    if (!created) {
      throw new NotFoundException('Usuário recém-criado não foi encontrado.');
    }

    return this.buildAuthResponse(created);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithRelations(
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatches = await compare(loginDto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.buildAuthResponse(user);
  }

  async me(
    authenticatedUser: AuthenticatedUser,
  ): Promise<AuthResponseDto['user']> {
    const user = await this.usersService.findByIdWithRelations(
      authenticatedUser.sub,
    );

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.buildAuthResponse(user).user;
  }

  private buildAuthResponse(user: UserWithIncludes): AuthResponseDto {
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

    if (profileType === ProfileType.CUSTOMER) {
      return UserRole.CUSTOMER;
    }

    return UserRole.ADMIN;
  }

  private mapRoleToProfileType(role: UserRole): ProfileType {
    if (role === UserRole.LOCATOR) {
      return ProfileType.COMPANY;
    }

    return ProfileType.CUSTOMER;
  }

  private validateRegisterPayload(registerDto: RegisterUserDto): void {
    if (
      !registerDto.email ||
      !registerDto.password ||
      !registerDto.profileType
    ) {
      throw new BadRequestException(
        'email, password e profileType são obrigatórios.',
      );
    }

    if (
      registerDto.profileType === ProfileType.COMPANY &&
      !registerDto.company
    ) {
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
