import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CompanySummary } from './interfaces/company-summary.interface';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Prisma } from '../../generated/prisma/client/client';

type CompanyDbAccessor = Pick<PrismaService, 'company'>;

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(authenticatedUser: AuthenticatedUser): Promise<CompanySummary> {
    const company = await this.findFirst({
      where: { userId: authenticatedUser.sub },
    });

    if (!company) {
      throw new ForbiddenException('Usuário não possui company vinculada.');
    }

    return this.toSummary(company);
  }

  async updateMine(
    authenticatedUser: AuthenticatedUser,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanySummary> {
    const company = await this.findFirst({
      where: { userId: authenticatedUser.sub },
    });

    if (!company) {
      throw new ForbiddenException('Usuário não possui company vinculada.');
    }

    const updatedCompany = await this.update({
      where: { id: company.id },
      data: {
        name: updateCompanyDto.name,
        phone: updateCompanyDto.phone,
        description: updateCompanyDto.description,
      },
    });

    return this.toSummary(updatedCompany);
  }

  async findAll(): Promise<CompanySummary[]> {
    const companies = await this.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return companies.map((company) => this.toSummary(company));
  }

  async findOne(id: string): Promise<CompanySummary> {
    const company = await this.findFirst({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company não encontrada.');
    }

    return this.toSummary(company);
  }

  async findFirst(args: Prisma.CompanyFindFirstArgs, db?: CompanyDbAccessor) {
    return this.companyModel(db).findFirst(args);
  }

  async findMany(args: Prisma.CompanyFindManyArgs, db?: CompanyDbAccessor) {
    return this.companyModel(db).findMany(args);
  }

  async create(args: Prisma.CompanyCreateArgs, db?: CompanyDbAccessor) {
    return this.companyModel(db).create(args);
  }

  async update(args: Prisma.CompanyUpdateArgs, db?: CompanyDbAccessor) {
    return this.companyModel(db).update(args);
  }

  private companyModel(db?: CompanyDbAccessor) {
    return db?.company ?? this.prisma.company;
  }

  private toSummary(company: {
    id: string;
    userId: string;
    name: string;
    cnpj: string;
    phone: string | null;
    description: string | null;
    evaluation: number;
    createdAt: Date;
    updatedAt: Date;
  }): CompanySummary {
    return {
      id: company.id,
      userId: company.userId,
      name: company.name,
      cnpj: company.cnpj,
      phone: company.phone,
      description: company.description,
      evaluation: company.evaluation,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
