import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

export const listCategories = async (_req: Request, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { items: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  res.status(200).json({ success: true, data: categories });
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const { name, description } = categorySchema.parse(req.body);

  const existing = await prisma.category.findUnique({
    where: { name: name.trim() },
  });

  if (existing) {
    res.status(409).json({ success: false, message: `Category '${name}' already exists.` });
    return;
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
    },
  });

  res.status(201).json({ success: true, data: category });
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description } = categorySchema.parse(req.body);

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: name.trim(),
      description: description?.trim() || null,
    },
  });

  res.status(200).json({ success: true, data: category });
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const itemCount = await prisma.item.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    res.status(400).json({
      success: false,
      message: `Cannot delete category with ${itemCount} associated item(s).`,
    });
    return;
  }

  await prisma.category.delete({ where: { id } });
  res.status(200).json({ success: true, message: 'Category deleted successfully.' });
};
