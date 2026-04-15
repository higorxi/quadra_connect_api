export interface ReviewSummary {
  id: string;
  reservationId: string;
  customerId: string;
  unitId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}
