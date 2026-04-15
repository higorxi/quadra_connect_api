import { ProfileType } from '../../common/enums/profile-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  profileType: ProfileType;
}
