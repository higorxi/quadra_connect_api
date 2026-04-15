import { UserRole } from 'generated/prisma/client';
import { ProfileType } from '../../common/enums/profile-type.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  profileType: ProfileType;
}
