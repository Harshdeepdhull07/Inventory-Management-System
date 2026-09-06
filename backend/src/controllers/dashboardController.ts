import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { LedgerService } from '../services/ledgerService.js';
import { ItemStatus, MovementType } from '@prisma/client';

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const eightWeeksAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);

  // 1. Basic Counts
  const [activeItemsCount, todayMovementsCount] = await Promise.all([
    prisma.item.count({ where: { status: ItemStatus.ACTIVE } }),
    prisma.stockMovement.count({
      where: {
        createdAt: { gte: startOfToday },
      },
    }),
  ]);

  // 2. Items moved this week
  const weeklyMovements = await prisma.stockMovement.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { itemId: true },
    distinct: ['itemId'],
  });
  const itemsMovedThisWeekCount = weeklyMovements.length;

  // 3. Low stock calculation across all active items
  const activeItems = await prisma.item.findMany({
    where: { status: ItemStatus.ACTIVE },
    include: { category: true },
  });

  let lowStockCount = 0;
  const categoryStockMap = new Map<string, number>();
  activeItems.forEach((i) => {
    if (!categoryStockMap.has(i.category.name)) {
      categoryStockMap.set(i.category.name, 0);
    }
  });

  for (const item of activeItems) {
    const totalStock = await LedgerService.getItemTotalStock(item.id);
    if (totalStock <= item.reorderLevel) {
      lowStockCount++;
    }
    const currentCatStock = categoryStockMap.get(item.category.name) || 0;
    categoryStockMap.set(item.category.name, currentCatStock + totalStock);
  }

  const categoryDistribution = Array.from(categoryStockMap.entries()).map(([name, stock]) => ({
    category: name,
    stock,
  }));

  // 4. Stock by Location
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
  });

  const locationStockDistribution = await Promise.all(
    locations.map(async (loc) => {
      let totalLocStock = 0;
      for (const item of activeItems) {
        const s = await LedgerService.getItemStockAtLocation(item.id, loc.id);
        totalLocStock += s;
      }
      return {
        locationId: loc.id,
        name: loc.name,
        code: loc.code,
        stock: totalLocStock,
      };
    })
  );

  // 5. Last 8 Weeks Receipt & Issue Trends
  const historicalMovements = await prisma.stockMovement.findMany({
    where: {
      createdAt: { gte: eightWeeksAgo },
      type: { in: [MovementType.RECEIPT, MovementType.ISSUE] },
    },
    select: {
      type: true,
      quantity: true,
      createdAt: true,
    },
  });

  // Aggregate into 8 weekly buckets
  const weeklyTrendsMap = new Map<string, { weekLabel: string; receipts: number; issues: number }>();
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const label = `Wk ${8 - w} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    weeklyTrendsMap.set(label, { weekLabel: label, receipts: 0, issues: 0 });
  }

  const trendLabels = Array.from(weeklyTrendsMap.keys());
  for (const m of historicalMovements) {
    const diffDays = Math.floor((now.getTime() - m.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    const weekIndex = Math.min(7, Math.max(0, 7 - Math.floor(diffDays / 7)));
    const label = trendLabels[weekIndex];
    if (label && weeklyTrendsMap.has(label)) {
      const bucket = weeklyTrendsMap.get(label)!;
      if (m.type === MovementType.RECEIPT) {
        bucket.receipts += m.quantity;
      } else if (m.type === MovementType.ISSUE) {
        bucket.issues += m.quantity;
      }
    }
  }

  const weeklyTrends = Array.from(weeklyTrendsMap.values());

  // 6. Recent activity feed (latest 5 movements)
  const recentMovements = await prisma.stockMovement.findMany({
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: {
      item: true,
      sourceLocation: true,
      destinationLocation: true,
      user: { select: { name: true, role: true } },
    },
  });

  res.status(200).json({
    success: true,
    data: {
      summary: {
        activeItems: activeItemsCount,
        lowStock: lowStockCount,
        todayMovements: todayMovementsCount,
        itemsMovedThisWeek: itemsMovedThisWeekCount,
      },
      categoryDistribution,
      locationStockDistribution,
      weeklyTrends,
      recentMovements,
    },
  });
};
