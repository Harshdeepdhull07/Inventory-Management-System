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

const noteSchema = z.object({
  note: z.string().min(1, 'Note content is required'),
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

  // Log Immutable Creation Event
  await prisma.itemAuditLog.create({
    data: {
      itemId: item.id,
      type: 'CREATED',
      note: `Item created with SKU '${item.sku}', Name '${item.name}', Reorder Level ${item.reorderLevel} ${item.unit}.`,
      userId: req.user!.id,
    },
  });

  res.status(201).json({ success: true, data: item });
};

export const updateItem = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { sku, name, description, unit, reorderLevel, categoryId } = itemSchema.parse(req.body);

  const existingItem = await prisma.item.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!existingItem) {
    res.status(404).json({ success: false, message: 'Item not found' });
    return;
  }

  const newCategory = await prisma.category.findUnique({ where: { id: categoryId } });

  // Record audit logs for any changed fields
  const fieldChanges: { fieldName: string; oldValue: string; newValue: string }[] = [];

  if (existingItem.name !== name.trim()) {
    fieldChanges.push({ fieldName: 'Name', oldValue: existingItem.name, newValue: name.trim() });
  }
  if (existingItem.categoryId !== categoryId) {
    fieldChanges.push({
      fieldName: 'Category',
      oldValue: existingItem.category.name,
      newValue: newCategory?.name || categoryId,
    });
  }
  if (existingItem.reorderLevel !== reorderLevel) {
    fieldChanges.push({
      fieldName: 'Reorder Level',
      oldValue: existingItem.reorderLevel.toString(),
      newValue: reorderLevel.toString(),
    });
  }
  if (existingItem.unit !== (unit.trim() || 'pcs')) {
    fieldChanges.push({
      fieldName: 'Unit of Measure',
      oldValue: existingItem.unit,
      newValue: unit.trim() || 'pcs',
    });
  }

  const updatedItem = await prisma.item.update({
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

  // Commit audit entries for each changed field
  for (const change of fieldChanges) {
    await prisma.itemAuditLog.create({
      data: {
        itemId: id,
        type: 'FIELD_CHANGE',
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        userId: req.user!.id,
      },
    });
  }

  const totalStock = await LedgerService.getItemTotalStock(id);
  const isLowStock = totalStock <= updatedItem.reorderLevel;

  res.status(200).json({
    success: true,
    data: {
      ...updatedItem,
      currentStock: totalStock,
      isLowStock,
    },
  });
};

export const addItemNote = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { note } = noteSchema.parse(req.body);

  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) {
    res.status(404).json({ success: false, message: 'Item not found' });
    return;
  }

  const auditLog = await prisma.itemAuditLog.create({
    data: {
      itemId: id,
      type: 'NOTE',
      note: note.trim(),
      userId: req.user!.id,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Staff note recorded permanently on item timeline.',
    data: auditLog,
  });
};

export const archiveItem = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const item = await prisma.item.update({
    where: { id },
    data: { status: ItemStatus.ARCHIVED },
  });

  await prisma.itemAuditLog.create({
    data: {
      itemId: id,
      type: 'STATUS_CHANGE',
      note: `Item archived. New stock movements blocked.`,
      userId: req.user!.id,
    },
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

  await prisma.itemAuditLog.create({
    data: {
      itemId: id,
      type: 'STATUS_CHANGE',
      note: `Item restored to active operational status.`,
      userId: req.user!.id,
    },
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

  const [movements, auditLogs] = await Promise.all([
    prisma.stockMovement.findMany({
      where: { itemId: id },
      include: {
        sourceLocation: true,
        destinationLocation: true,
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.itemAuditLog.findMany({
      where: { itemId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Merge movements and audit logs into a unified timeline
  let runningTotalBalance = 0;
  const movementEvents = movements.map((m: any) => {
    let delta = 0;
    if (m.type === 'RECEIPT') delta = m.quantity;
    else if (m.type === 'ISSUE') delta = -m.quantity;
    else if (m.type === 'ADJUSTMENT') delta = m.quantity;
    else if (m.type === 'TRANSFER') delta = 0;

    runningTotalBalance += delta;

    return {
      id: m.id,
      eventKind: 'MOVEMENT',
      type: m.type,
      quantity: m.quantity,
      delta,
      balanceAfter: runningTotalBalance,
      sourceLocation: m.sourceLocation,
      destinationLocation: m.destinationLocation,
      reference: m.reference,
      notes: m.notes,
      user: m.user,
      createdAt: m.createdAt,
    };
  });

  const auditEvents = auditLogs.map((log: any) => ({
    id: log.id,
    eventKind: 'AUDIT',
    type: log.type,
    fieldName: log.fieldName,
    oldValue: log.oldValue,
    newValue: log.newValue,
    note: log.note,
    user: log.user,
    createdAt: log.createdAt,
  }));

  const combinedTimeline = [...movementEvents, ...auditEvents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.status(200).json({
    success: true,
    data: {
      item,
      currentTotalStock: runningTotalBalance,
      timeline: combinedTimeline,
    },
  });
};
