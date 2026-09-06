export const Role = {
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ItemStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export const MovementType = {
  RECEIPT: 'RECEIPT',
  ISSUE: 'ISSUE',
  TRANSFER: 'TRANSFER',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;
export type MovementType = (typeof MovementType)[keyof typeof MovementType];

export const AlertStatus = {
  ACTIVE: 'ACTIVE',
  DISMISSED: 'DISMISSED',
  RESOLVED: 'RESOLVED',
} as const;
export type AlertStatus = (typeof AlertStatus)[keyof typeof AlertStatus];
