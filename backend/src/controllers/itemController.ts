import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { LedgerService } from '../services/ledgerService.js';
import { ItemStatus } from '../types/enums.js';
import { Prisma } from '@prisma/client';

const itemSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  unit: z.string().default('pcs'),
  reorderLevel: z.number().int().min(0).default(10),
  categoryId: z.string().min(1, 'Category is required'),
});

export const listInventory = async (req: Request, res: Response): Promise<void> => {
  const {
    search,
    categoryId,
    locationId,
    status = 'ACTIVE',
    lowStockOnly,
    sortBy = 'name',
    sortOrder = 'asc',
    page = '1',
    limit = '10',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where: Prisma.ItemWhereInput = {};

  if (status !== 'ALL') {
    where.status = status;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search) {
    where.OR = [
      { sku: { contains: search } },
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const allMatchingItems = await prisma.item.findMany({
    where,
    include: {
      category: true,
    },
    orderBy:
      sortBy === 'category'
        ? { category: { name: sortOrder === 'desc' ? 'desc' : 'asc' } }
        : sortBy === 'sku'
        ? { sku: sortOrder === 'desc' ? 'desc' : 'asc' }
        : sortBy === 'createdAt'
        ? { createdAt: sortOrder === 'desc' ? 'desc' : 'asc' }
        : sortBy === 'reorderLevel'
        ? { reorderLevel: sortOrder === 'desc' ? 'desc' : 'asc' }
        : { name: sortOrder === 'desc' ? 'desc' : 'asc' },
  });

  const itemsWithStock = await Promise.all(
    allMatchingItems.map(async (item) => {
      let stock = 0;
      if (locationId) {
        stock = await LedgerService.getItemStockAtLocation(item.id, locationId);
      } else {
        stock = await LedgerService.getItemTotalStock(item.id);
      }
      const isLowStock = stock <= item.reorderLevel;

      return {
        ...item,
        currentStock: stock,
        isLowStock,
      };
    })
  );

  let filteredItems = itemsWithStock;
  if (lowStockOnly === 'true') {
    filteredItems = filteredItems.filter((i) => i.isLowStock);
  }

  if (sortBy === 'totalStock' || sortBy === 'stock' || sortBy === 'currentStock') {
    filteredItems.sort((a, b) =>
      sortOrder === 'desc' ? b.currentStock - a.currentStock : a.currentStock - b.currentStock
    );
  }

  const totalCount = filteredItems.length;
  const paginatedItems = filteredItems.slice(skip, skip + limitNum);
  const totalPages = Math.ceil(totalCount / limitNum);

  res.status(200).json({
    success: true,
    data: paginatedItems,
    pagination: {
      totalCount,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1,
    },
  });
};

export const getItemById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      alerts: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  if (!item) {
    res.status(404).json({ success: false, message: 'Item not found' });
    return;
  }

  const stockInfo = await LedgerService.getItemStockBreakdown(id);

  res.status(200).json({
    success: true,
    data: {
      ...item,
      ...stockInfo,
      isLowStock: stockInfo.totalStock <= item.reorderLevel,
    },
  });
};

export const createItem = async (req: Request, res: Response): Promise<void> => {
  const { sku, name, description, unit, reorderLevel, categoryId } = itemSchema.parse(req.body);

  const existing = await prisma.item.findUnique({ where: { sku: sku.toUpperCase().trim() } });
  if (existing) {
    res.status(409).json({ success: false, message: `Item with SKU '${sku}' already exists.` });
    return;
  }

  const item = await prisma.item.create({
    data: {
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      description: description?.trim() || null,
      unit: unit.trim() || 'pcs',
      reorderLevel,
      categoryId,
      status: ItemStatus.ACTIVE,
    },
    include: {
      category: true,
    },
  });

  res.status(201).json({ success: true, data: item });
};

export const updateItem = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { sku, name, description, unit, reorderLevel, categoryId } = itemSchema.parse(req.body);

  const item = await prisma.item.update({
    where: { id },
    data: {
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      description: description?.trim() || null,
      unit: unit.trim() || 'pcs',
      reorderLevel,
      categoryId,
    },
    include: {
      category: true,
    },
  });

  const totalStock = await LedgerService.getItemTotalStock(id);
  const isLowStock = totalStock <= item.reorderLevel;

  res.status(200).json({
    success: true,
    data: {
      ...item,
      currentStock: totalStock,
      isLowStock,
    },
  });
};

export const archiveItem = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const item = await prisma.item.update({
    where: { id },
    data: { status: ItemStatus.ARCHIVED },
  });

  res.status(200).json({
    success: true,
    message: `Item '${item.name}' (${item.sku}) has been archived.`,
    data: item,
  });
};

export const restoreItem = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const item = await prisma.item.update({
    where: { id },
    data: { status: ItemStatus.ACTIVE },
  });

  res.status(200).json({
    success: true,
    message: `Item '${item.name}' (${item.sku}) has been restored.`,
    data: item,
  });
};

export const getItemTimeline = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const item = await prisma.item.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!item) {
    res.status(404).json({ success: false, message: 'Item not found' });
    return;
  }

  const movements = await prisma.stockMovement.findMany({
    where: { itemId: id },
    include: {
      sourceLocation: true,
      destinationLocation: true,
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  let runningTotalBalance = 0;
  const timeline = movements.map((m) => {
    let delta = 0;
    if (m.type === 'RECEIPT') delta = m.quantity;
    else if (m.type === 'ISSUE') delta = -m.quantity;
    else if (m.type === 'ADJUSTMENT') delta = m.quantity;
    else if (m.type === 'TRANSFER') delta = 0;

    runningTotalBalance += delta;

    return {
      ...m,
      delta,
      balanceAfter: runningTotalBalance,
    };
  });

  timeline.reverse();

  res.status(200).json({
    success: true,
    data: {
      item,
      currentTotalStock: runningTotalBalance,
      timeline,
    },
  });
};
