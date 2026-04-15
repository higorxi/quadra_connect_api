import { UserRole } from '../../common/enums/user-role.enum';
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

export interface UserWithRelations {
  id: string;
  email: string | null;
  role: UserRole;
  password: string;
  company?: { id: string } | null;
  customer?: { id: string } | null;
  createdAt: Date;
  updatedAt: Date;
}
