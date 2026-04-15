export interface CompanyEntityProps {
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

export class CompanyEntity {
  id!: string;
  userId!: string;
  name!: string;
  cnpj!: string;
  phone!: string | null;
  description!: string | null;
  evaluation!: number;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(props: CompanyEntityProps) {
    Object.assign(this, props);
  }

  static fromPrisma(company: CompanyEntityProps): CompanyEntity {
    return new CompanyEntity({
      id: company.id,
      userId: company.userId,
      name: company.name,
      cnpj: company.cnpj,
      phone: company.phone,
      description: company.description,
      evaluation: company.evaluation,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    });
  }
}
