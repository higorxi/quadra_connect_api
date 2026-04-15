export const UserRole = {
  LOCATOR: 'LOCATOR',
  CUSTOMER: 'CUSTOMER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
