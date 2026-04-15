import { Prisma } from '../../../generated/prisma/client/client';

export type FindCompanyParams = {
  skip?: number;
  take?: number;
  cursor?: Prisma.CompanyWhereUniqueInput;
  where?: Prisma.CompanyWhereInput;
  orderBy?: Prisma.CompanyOrderByWithRelationInput;
};
