export interface CompanySummary {
  id: string;
  userId: string;
  name: string;
  cnpj: string;
  phone: string | null;
  description: string | null;
  evaluation: number;
  createdAt: Date;
  updatedAt: Date;
}
