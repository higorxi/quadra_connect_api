import { UserRole } from 'generated/prisma/client';
import { ProfileType } from '../../common/enums/profile-type.enum';

export interface UserSummary {
  id: string;
  email: string | null;
  role: UserRole;
  profileType: ProfileType;
  companyId: string | null;
  customerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
