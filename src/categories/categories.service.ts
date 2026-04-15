import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategorySummary } from './interfaces/category-summary.interface';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategorySummary> {
    const existing = await this.prismaService.category.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new BadRequestException('Já existe uma categoria com esse nome.');
    }

    const category = await this.prismaService.category.create({
      data: {
        name: createCategoryDto.name,
      },
    });

    return category;
  }

  async findAll(): Promise<CategorySummary[]> {
    return this.prismaService.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<CategorySummary> {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategorySummary> {
    await this.findOne(id);

    if (updateCategoryDto.name) {
      const existing = await this.prismaService.category.findUnique({
        where: { name: updateCategoryDto.name },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException('Já existe uma categoria com esse nome.');
      }
    }

    return this.prismaService.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string): Promise<CategorySummary> {
    await this.findOne(id);

    return this.prismaService.category.delete({
      where: { id },
    });
  }
}
