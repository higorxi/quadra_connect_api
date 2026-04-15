import { ProfileType } from '../../common/enums/profile-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export class UserEntity {
  constructor(partial: UserEntity) {
    Object.assign(this, partial);
  }

  id!: string;
  email!: string | null;
  role!: UserRole;
  profileType!: ProfileType;
  companyId!: string | null;
  customerId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
