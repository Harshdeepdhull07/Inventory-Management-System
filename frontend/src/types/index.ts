export type Role = 'MANAGER' | 'STAFF';
export type ItemStatus = 'ACTIVE' | 'ARCHIVED';
export type MovementType = 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT';
export type AlertStatus = 'ACTIVE' | 'DISMISSED' | 'RESOLVED';

export interface Location {
  id: string;
  name: string;
  code: string;
  type: string;
  address?: string | null;
  isActive: boolean;
  assignedUsers?: {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
    };
  }[];
  _count?: {
    sourceMovements: number;
    destinationMovements: number;
  };
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  assignedLocations?: Location[];
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    items: number;
  };
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  unit: string;
  reorderLevel: number;
  categoryId: string;
  category: Category;
  status: ItemStatus;
  currentStock?: number;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  item: Item;
  type: MovementType;
  quantity: number;
  sourceLocationId?: string | null;
  sourceLocation?: Location | null;
  destinationLocationId?: string | null;
  destinationLocation?: Location | null;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  reference?: string | null;
  notes?: string | null;
  delta?: number;
  balanceAfter?: number;
  createdAt: string;
}

export interface LowStockAlert {
  id: string;
  itemId: string;
  item: Item;
  locationId?: string | null;
  currentStock: number;
  reorderLevel: number;
  status: AlertStatus;
  dismissedBy?: string | null;
  dismissedAt?: string | null;
  createdAt: string;
}

export interface DashboardData {
  summary: {
    activeItems: number;
    lowStock: number;
    todayMovements: number;
    itemsMovedThisWeek: number;
  };
  categoryDistribution: {
    category: string;
    stock: number;
  }[];
  locationStockDistribution: {
    locationId: string;
    name: string;
    code: string;
    stock: number;
  }[];
  weeklyTrends: {
    weekLabel: string;
    receipts: number;
    issues: number;
  }[];
  recentMovements: StockMovement[];
}

export interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}
