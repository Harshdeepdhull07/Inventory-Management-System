import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';

const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  code: z.string().min(1, 'Location code is required'),
  type: z.string().default('WAREHOUSE'),
  address: z.string().optional(),
});

export const listLocations = async (_req: Request, res: Response): Promise<void> => {
  const locations = await prisma.location.findMany({
    include: {
      assignedUsers: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
      _count: {
        select: {
          sourceMovements: true,
          destinationMovements: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  res.status(200).json({ success: true, data: locations });
};

export const createLocation = async (req: Request, res: Response): Promise<void> => {
  const { name, code, type, address } = locationSchema.parse(req.body);

  const existingCode = await prisma.location.findUnique({ where: { code: code.toUpperCase().trim() } });
  if (existingCode) {
    res.status(409).json({ success: false, message: `Location code '${code}' already exists.` });
    return;
  }

  const existingName = await prisma.location.findUnique({ where: { name: name.trim() } });
  if (existingName) {
    res.status(409).json({ success: false, message: `Location name '${name}' already exists.` });
    return;
  }

  const location = await prisma.location.create({
    data: {
      name: name.trim(),
      code: code.toUpperCase().trim(),
      type: type.trim(),
      address: address?.trim() || null,
    },
  });

  res.status(201).json({ success: true, data: location });
};

export const updateLocation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, code, type, address } = locationSchema.parse(req.body);

  const location = await prisma.location.update({
    where: { id },
    data: {
      name: name.trim(),
      code: code.toUpperCase().trim(),
      type: type.trim(),
      address: address?.trim() || null,
    },
  });

  res.status(200).json({ success: true, data: location });
};

export const toggleLocationActive = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const loc = await prisma.location.findUnique({ where: { id } });
  if (!loc) {
    res.status(404).json({ success: false, message: 'Location not found' });
    return;
  }

  const updated = await prisma.location.update({
    where: { id },
    data: { isActive: !loc.isActive },
  });

  res.status(200).json({
    success: true,
    message: `Location ${updated.isActive ? 'activated' : 'deactivated'}.`,
    data: updated,
  });
};
