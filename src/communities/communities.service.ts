import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CustomersService } from '../customers/customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { JoinCommunityDto } from './dto/join-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import { CommunitySummary } from './interfaces/community-summary.interface';

@Injectable()
export class CommunitiesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly customersService: CustomersService,
  ) {}

  async create(
    authenticatedUser: AuthenticatedUser,
    createCommunityDto: CreateCommunityDto,
  ): Promise<CommunitySummary> {
    const customer = await this.customersService.findByUserIdOrThrow(
      authenticatedUser.sub,
    );

    const community = await this.prismaService.community.create({
      data: {
        ownerId: customer.id,
        name: createCommunityDto.name,
        description: createCommunityDto.description,
        isPrivate: createCommunityDto.isPrivate ?? true,
        inviteToken: randomUUID(),
        members: {
          create: {
            customerId: customer.id,
          },
        },
      },
    });

    return this.toSummary(community);
  }

  async findMine(
    authenticatedUser: AuthenticatedUser,
  ): Promise<CommunitySummary[]> {
    const customer = await this.customersService.findByUserIdOrThrow(
      authenticatedUser.sub,
    );
    const communities = await this.prismaService.community.findMany({
      where: { ownerId: customer.id },
      orderBy: { createdAt: 'desc' },
    });

    return communities.map((community) => this.toSummary(community));
  }

  async findJoined(
    authenticatedUser: AuthenticatedUser,
  ): Promise<CommunitySummary[]> {
    const customer = await this.customersService.findByUserIdOrThrow(
      authenticatedUser.sub,
    );
    const communities = await this.prismaService.community.findMany({
      where: {
        members: {
          some: {
            customerId: customer.id,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return communities.map((community) => this.toSummary(community));
  }

  async findOne(
    authenticatedUser: AuthenticatedUser,
    communityId: string,
  ): Promise<CommunitySummary> {
    const customer = await this.customersService.findByUserIdOrThrow(
      authenticatedUser.sub,
    );
    const community = await this.prismaService.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Comunidade não encontrada.');
    }

    if (!community.isPrivate) {
      return this.toSummary(community);
    }

    const membership = await this.prismaService.communityMember.findUnique({
      where: {
        communityId_customerId: {
          communityId,
          customerId: customer.id,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Você não possui permissão para acessar essa comunidade privada.',
      );
    }

    return this.toSummary(community);
  }

  async update(
    authenticatedUser: AuthenticatedUser,
    communityId: string,
    updateCommunityDto: UpdateCommunityDto,
  ): Promise<CommunitySummary> {
    const customer = await this.customersService.findByUserIdOrThrow(
      authenticatedUser.sub,
    );
    const community = await this.prismaService.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Comunidade não encontrada.');
    }

    if (community.ownerId !== customer.id) {
      throw new ForbiddenException(
        'Somente o owner da comunidade pode atualizá-la.',
      );
    }

    const updatedCommunity = await this.prismaService.community.update({
      where: { id: communityId },
      data: updateCommunityDto,
    });

    return this.toSummary(updatedCommunity);
  }

  async join(
    authenticatedUser: AuthenticatedUser,
    joinCommunityDto: JoinCommunityDto,
  ): Promise<{ message: string }> {
    const customer = await this.customersService.findByUserIdOrThrow(
      authenticatedUser.sub,
    );
    const community = await this.prismaService.community.findUnique({
      where: { inviteToken: joinCommunityDto.inviteToken },
    });

    if (!community) {
      throw new NotFoundException('Token de convite inválido.');
    }

    const existingMembership =
      await this.prismaService.communityMember.findUnique({
        where: {
          communityId_customerId: {
            communityId: community.id,
            customerId: customer.id,
          },
        },
      });

    if (existingMembership) {
      throw new BadRequestException('Você já participa dessa comunidade.');
    }

    await this.prismaService.communityMember.create({
      data: {
        communityId: community.id,
        customerId: customer.id,
      },
    });

    return { message: 'Você entrou na comunidade com sucesso.' };
  }

  private toSummary(community: {
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    inviteToken: string;
    isPrivate: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CommunitySummary {
    return {
      id: community.id,
      ownerId: community.ownerId,
      name: community.name,
      description: community.description,
      inviteToken: community.inviteToken,
      isPrivate: community.isPrivate,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
    };
  }
}
