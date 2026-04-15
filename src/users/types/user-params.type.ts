import { Prisma } from '../../../generated/prisma/client/client';

export type UserFindParams = {
  skip?: number;
  take?: number;
  cursor?: Prisma.UserWhereUniqueInput;
  where?: Prisma.UserWhereInput;
  orderBy?:
    | Prisma.UserOrderByWithRelationInput
    | Prisma.UserOrderByWithRelationInput[];
  include?: Prisma.UserInclude;
};

export type FindFirstUserParams = {
  where?: Prisma.UserWhereInput;
  orderBy?:
    | Prisma.UserOrderByWithRelationInput
    | Prisma.UserOrderByWithRelationInput[];
  include?: Prisma.UserInclude;
};

export type FindManyUsersParams = {
  skip?: number;
  take?: number;
  cursor?: Prisma.UserWhereUniqueInput;
  where?: Prisma.UserWhereInput;
  orderBy?:
    | Prisma.UserOrderByWithRelationInput
    | Prisma.UserOrderByWithRelationInput[];
  include?: Prisma.UserInclude;
};

export type CreateUserParams = {
  data: Prisma.UserCreateInput;
  include?: Prisma.UserInclude;
};

export type UpdateUserParams = {
  where: Prisma.UserWhereUniqueInput;
  data: Prisma.UserUncheckedUpdateInput;
  include?: Prisma.UserInclude;
};
