import { SetMetadata } from '@nestjs/common';
import { ProfileType } from '../../common/enums/profile-type.enum';

export const ALLOWED_PROFILES_KEY = 'allowed_profiles';

export const AllowedProfiles = (...profiles: ProfileType[]) =>
  SetMetadata(ALLOWED_PROFILES_KEY, profiles);
