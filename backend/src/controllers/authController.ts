import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';
import { Role } from '../types/enums.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['MANAGER', 'STAFF']).default('STAFF'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, name, role } = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    res.status(409).json({ success: false, message: 'Email is already registered.' });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully.',
    data: { user, token },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      assignedLocations: {
        include: { location: true },
      },
    },
  });

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        assignedLocations: user.assignedLocations.map((al) => al.location),
      },
      token,
    },
  });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      assignedLocations: {
        include: {
          location: true,
        },
      },
    },
  });

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedLocations: user.assignedLocations.map((al) => al.location),
    },
  });
};

export const listUsers = async (_req: Request, res: Response): Promise<void> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      assignedLocations: {
        include: {
          location: true,
        },
      },
      createdAt: true,
    },
    orderBy: { name: 'asc' },
  });

  res.status(200).json({ success: true, data: users });
};

export const assignStaffLocations = async (req: Request, res: Response): Promise<void> => {
  const { userId, locationIds } = req.body as { userId: string; locationIds: string[] };

  if (!userId || !Array.isArray(locationIds)) {
    res.status(400).json({ success: false, message: 'userId and locationIds array required' });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.userLocation.deleteMany({ where: { userId } });
    if (locationIds.length > 0) {
      await tx.userLocation.createMany({
        data: locationIds.map((locationId) => ({
          userId,
          locationId,
        })),
      });
    }
  });

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      assignedLocations: {
        include: { location: true },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Staff location assignments updated successfully.',
    data: updatedUser,
  });
};
