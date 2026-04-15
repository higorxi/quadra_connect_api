export interface UnitSummary {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  pricePerHour: string;
  requiresConfirmation: boolean;
  bailValue: string | null;
  createdAt: Date;
  updatedAt: Date;
}
