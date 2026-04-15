import { CustomerSummary } from '../interfaces/customer-summary.interface';

type CustomerEntityInput = CustomerSummary & {
  createdAt: Date;
  updatedAt: Date;
};

export class CustomerEntity implements CustomerSummary {
  id: string;
  userId: string;
  name: string;
  cpf: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(input: CustomerEntityInput) {
    this.id = input.id;
    this.userId = input.userId;
    this.name = input.name;
    this.cpf = input.cpf;
    this.phone = input.phone;
    this.createdAt = input.createdAt;
    this.updatedAt = input.updatedAt;
  }

  static fromPrisma(input: CustomerEntityInput): CustomerEntity {
    return new CustomerEntity(input);
  }
}
