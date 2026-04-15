export interface CustomerSummary {
  id: string;
  userId: string;
  name: string;
  cpf: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}
