import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CompaniesService } from '../companies/companies.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitSummary } from './interfaces/unit-summary.interface';

@Injectable()
export class UnitsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(
    authenticatedUser: AuthenticatedUser,
    createUnitDto: CreateUnitDto,
  ): Promise<UnitSummary> {
    const company = await this.companiesService.findCompanyByUserId(
      authenticatedUser.sub,
    );
    await this.ensureCategoryExists(createUnitDto.categoryId);

    const unit = await this.prismaService.unit.create({
      data: {
        companyId: company.id,
        categoryId: createUnitDto.categoryId,
        name: createUnitDto.name,
        description: createUnitDto.description,
        address: createUnitDto.address,
        city: createUnitDto.city,
        state: createUnitDto.state.toUpperCase(),
        pricePerHour: createUnitDto.pricePerHour,
        requiresConfirmation: createUnitDto.requiresConfirmation ?? false,
        bailValue: createUnitDto.bailValue,
      },
    });

    return this.toSummary(unit);
  }

  async findAll(): Promise<UnitSummary[]> {
    const units = await this.prismaService.unit.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return units.map((unit) => this.toSummary(unit));
  }

  async findByCompany(
    authenticatedUser: AuthenticatedUser,
  ): Promise<UnitSummary[]> {
    const company = await this.companiesService.findCompanyByUserId(
      authenticatedUser.sub,
    );
    const units = await this.prismaService.unit.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    });

    return units.map((unit) => this.toSummary(unit));
  }

  async findOne(id: string): Promise<UnitSummary> {
    const unit = await this.prismaService.unit.findUnique({
      where: { id },
    });

    if (!unit) {
      throw new NotFoundException('Unidade não encontrada.');
    }

    return this.toSummary(unit);
  }

  async update(
    authenticatedUser: AuthenticatedUser,
    id: string,
    updateUnitDto: UpdateUnitDto,
  ): Promise<UnitSummary> {
    const unit = await this.prismaService.unit.findUnique({
      where: { id },
    });

    if (!unit) {
      throw new NotFoundException('Unidade não encontrada.');
    }

    const company = await this.companiesService.findCompanyByUserId(
      authenticatedUser.sub,
    );
    if (unit.companyId !== company.id) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar unidades de outra company.',
      );
    }

    if (updateUnitDto.categoryId) {
      await this.ensureCategoryExists(updateUnitDto.categoryId);
    }

    const updatedUnit = await this.prismaService.unit.update({
      where: { id },
      data: {
        categoryId: updateUnitDto.categoryId,
        name: updateUnitDto.name,
        description: updateUnitDto.description,
        address: updateUnitDto.address,
        city: updateUnitDto.city,
        state: updateUnitDto.state?.toUpperCase(),
        pricePerHour: updateUnitDto.pricePerHour,
        requiresConfirmation: updateUnitDto.requiresConfirmation,
        bailValue: updateUnitDto.bailValue,
      },
    });

    return this.toSummary(updatedUnit);
  }

  async remove(
    authenticatedUser: AuthenticatedUser,
    id: string,
  ): Promise<UnitSummary> {
    const unit = await this.prismaService.unit.findUnique({
      where: { id },
    });

    if (!unit) {
      throw new NotFoundException('Unidade não encontrada.');
    }

    const company = await this.companiesService.findCompanyByUserId(
      authenticatedUser.sub,
    );
    if (unit.companyId !== company.id) {
      throw new ForbiddenException(
        'Você não tem permissão para remover unidades de outra company.',
      );
    }

    const hasReservation = await this.prismaService.reservation.findFirst({
      where: { unitId: id },
      select: { id: true },
    });

    if (hasReservation) {
      throw new BadRequestException(
        'Não é possível remover a unidade, pois já existem reservas associadas.',
      );
    }

    const deletedUnit = await this.prismaService.unit.delete({
      where: { id },
    });
    return this.toSummary(deletedUnit);
  }

  private async ensureCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prismaService.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Categoria informada não foi encontrada.');
    }
  }

  private toSummary(unit: {
    id: string;
    companyId: string;
    categoryId: string;
    name: string;
    description: string | null;
    address: string;
    city: string;
    state: string;
    pricePerHour: Prisma.Decimal;
    requiresConfirmation: boolean;
    bailValue: Prisma.Decimal | null;
    createdAt: Date;
    updatedAt: Date;
  }): UnitSummary {
    return {
      id: unit.id,
      companyId: unit.companyId,
      categoryId: unit.categoryId,
      name: unit.name,
      description: unit.description,
      address: unit.address,
      city: unit.city,
      state: unit.state,
      pricePerHour: unit.pricePerHour.toString(),
      requiresConfirmation: unit.requiresConfirmation,
      bailValue: unit.bailValue?.toString() ?? null,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
    };
  }
}
