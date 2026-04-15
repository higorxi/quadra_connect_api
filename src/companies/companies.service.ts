import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CompanySummary } from './interfaces/company-summary.interface';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Prisma } from '../../generated/prisma/client/client';
import { FindCompanyParams } from './types/company-params.type';

type CompanyDbAccessor = Pick<PrismaService, 'company'>;

@Injectable()
export class CompaniesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getCompaniesBy(params: FindCompanyParams): Promise<CompanySummary[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const companies = await this.prismaService.company.findMany({
      where,
      skip,
      take,
      cursor,
      orderBy,
    });
    return companies.map((company) => this.toSummary(company));
  }

  async listCompanies(params: FindCompanyParams): Promise<CompanySummary[]> {
    const { skip, take, cursor, where, orderBy } = params;
    const companies = await this.prismaService.company.findMany({
      where,
      skip,
      take,
      cursor,
      orderBy,
    });
    return companies.map((company) => this.toSummary(company));
  }

  async findCompany(data: Prisma.CompanyWhereInput): Promise<CompanySummary | null> {
    const company = await this.prismaService.company.findFirst({
      where: data,
    });
    return company ? this.toSummary(company) : null;
  }

  async createCompany(
    data: Prisma.CompanyUncheckedCreateInput,
  ): Promise<CompanySummary> {
    const company = await this.prismaService.company.create({
      data,
    });
    return this.toSummary(company);
  }

  async updateCompany(params: {
    where: Prisma.CompanyWhereUniqueInput;
    data: Prisma.CompanyUncheckedUpdateInput;
  }): Promise<CompanySummary> {
    const { where, data } = params;
    const company = await this.prismaService.company.update({
      where,
      data,
    });
    return this.toSummary(company);
  }

  async updateManyCompanies(params: {
    where: Prisma.CompanyWhereInput;
    data: Prisma.CompanyUpdateManyMutationInput;
  }): Promise<Prisma.BatchPayload> {
    const { where, data } = params;
    return await this.prismaService.company.updateMany({
      where,
      data,
    });
  }

  async deleteCompany(where: Prisma.CompanyWhereUniqueInput): Promise<CompanySummary> {
    const company = await this.prismaService.company.delete({
      where,
    });
    return this.toSummary(company);
  }

  async findMine(authenticatedUser: AuthenticatedUser): Promise<CompanySummary> {
    const company = await this.findCompany({ userId: authenticatedUser.sub });

    if (!company) {
      throw new ForbiddenException('Usuário não possui company vinculada.');
    }

    return company;
  }

  async updateMine(
    authenticatedUser: AuthenticatedUser,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanySummary> {
    const company = await this.findCompany({ userId: authenticatedUser.sub });

    if (!company) {
      throw new ForbiddenException('Usuário não possui company vinculada.');
    }

    const updatedCompany = await this.updateCompany({
      where: { id: company.id },
      data: {
        name: updateCompanyDto.name,
        phone: updateCompanyDto.phone,
        description: updateCompanyDto.description,
      },
    });
    return updatedCompany;
  }

  async create(
    params: { data: Prisma.CompanyUncheckedCreateInput },
    db?: CompanyDbAccessor,
  ): Promise<CompanySummary> {
    const company = await (db?.company ?? this.prismaService.company).create({
      data: params.data,
    });
    return this.toSummary(company);
  }

  async findAll(): Promise<CompanySummary[]> {
    const companies = await this.getCompaniesBy({
      orderBy: { createdAt: 'desc' },
    });
    return companies;
  }

  async findOne(id: string): Promise<CompanySummary> {
    const company = await this.findCompany({ id });

    if (!company) {
      throw new NotFoundException('Company não encontrada.');
    }
    return company;
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
