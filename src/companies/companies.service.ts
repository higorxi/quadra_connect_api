import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CompanyEntity } from './entities/company.entity';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(authenticatedUser: AuthenticatedUser): Promise<CompanyEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUser.sub },
      include: {
        company: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (!user.company) {
      throw new ForbiddenException('Usuário não possui company vinculada.');
    }

    return CompanyEntity.fromPrisma(user.company);
  }

  async updateMine(
    authenticatedUser: AuthenticatedUser,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id: authenticatedUser.sub },
      select: {
        company: {
          select: { id: true },
        },
      },
    });

    const companyId = user?.company?.id;

    if (!companyId) {
      throw new ForbiddenException('Usuário não possui company vinculada.');
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        name: updateCompanyDto.name,
        phone: updateCompanyDto.phone,
        description: updateCompanyDto.description,
      },
    });

    return CompanyEntity.fromPrisma(updatedCompany);
  }

  async findAll(): Promise<CompanyEntity[]> {
    const companies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return companies.map((company) => CompanyEntity.fromPrisma(company));
  }

  async findOne(id: string): Promise<CompanyEntity> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company não encontrada.');
    }

    return CompanyEntity.fromPrisma(company);
  }
}
