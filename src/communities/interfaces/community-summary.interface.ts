export interface CommunitySummary {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  inviteToken: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}
