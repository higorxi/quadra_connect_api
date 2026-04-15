import { IsNotEmpty, IsString } from 'class-validator';

export class JoinCommunityDto {
  @IsString()
  @IsNotEmpty()
  inviteToken!: string;
}
