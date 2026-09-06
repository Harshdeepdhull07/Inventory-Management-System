import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { LedgerService } from '../services/ledgerService.js';
import { MovementType, Prisma } from '@prisma/client';

const receiptSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  destinationLocationId: z.string().min(1, 'Destination location is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const issueSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  sourceLocationId: z.string().min(1, 'Source location is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const transferSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  sourceLocationId: z.string().min(1, 'Source location is required'),
  destinationLocationId: z.string().min(1, 'Destination location is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const adjustmentSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  locationId: z.string().min(1, 'Location is required'),
  deltaQuantity: z.number().int().refine((n) => n !== 0, 'Delta cannot be 0'),
  reference: z.string().optional(),
  notes: z.string().min(3, 'Adjustment reason is required'),
});

export const createReceipt = async (req: Request, res: Response): Promise<void> => {
  const { itemId, destinationLocationId, quantity, reference, notes } = receiptSchema.parse(req.body);

  const movement = await LedgerService.recordReceipt({
    itemId,
    destinationLocationId,
    quantity,
    userId: req.user!.id,
    reference,
    notes,
  });

  res.status(201).json({
    success: true,
    message: 'Stock receipt recorded successfully in ledger.',
    data: movement,
  });
};

export const createIssue = async (req: Request, res: Response): Promise<void> => {
  const { itemId, sourceLocationId, quantity, reference, notes } = issueSchema.parse(req.body);

  const movement = await LedgerService.recordIssue({
    itemId,
    sourceLocationId,
    quantity,
    userId: req.user!.id,
    reference,
    notes,
  });

  res.status(201).json({
    success: true,
    message: 'Stock issue recorded successfully in ledger.',
    data: movement,
  });
};

export const createTransfer = async (req: Request, res: Response): Promise<void> => {
  const { itemId, sourceLocationId, destinationLocationId, quantity, reference, notes } = transferSchema.parse(req.body);

  const movement = await LedgerService.recordTransfer({
    itemId,
    sourceLocationId,
    destinationLocationId,
    quantity,
    userId: req.user!.id,
    reference,
    notes,
  });

  res.status(201).json({
    success: true,
    message: 'Stock transfer completed atomically and logged in ledger.',
    data: movement,
  });
};

export const createAdjustment = async (req: Request, res: Response): Promise<void> => {
  const { itemId, locationId, deltaQuantity, reference, notes } = adjustmentSchema.parse(req.body);

  const movement = await LedgerService.recordAdjustment({
    itemId,
    locationId,
    deltaQuantity,
    userId: req.user!.id,
    reference,
    notes,
  });

  res.status(201).json({
    success: true,
    message: 'Stock adjustment recorded with audit reason.',
    data: movement,
  });
};

export const listMovements = async (req: Request, res: Response): Promise<void> => {
  const {
    itemId,
    type,
    locationId,
    startDate,
    endDate,
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where: Prisma.StockMovementWhereInput = {};

  if (itemId) where.itemId = itemId;
  if (type) where.type = type as MovementType;

  if (locationId) {
    where.OR = [
      { sourceLocationId: locationId },
      { destinationLocationId: locationId },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [totalCount, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      include: {
        item: {
          include: { category: true },
        },
        sourceLocation: true,
        destinationLocation: true,
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: movements,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
      limit: limitNum,
    },
  });
};
