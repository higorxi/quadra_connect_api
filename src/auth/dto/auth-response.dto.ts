import { UserRole } from 'generated/prisma/client';
import { ProfileType } from '../../common/enums/profile-type.enum';

export class AuthUserResponseDto {
  id: string;
  email: string | null;
  role: UserRole;
  profileType: ProfileType;
  companyId: string | null;
  customerId: string | null;
}

export class AuthResponseDto {
  accessToken: string;
  user: AuthUserResponseDto;
}
