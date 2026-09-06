import { prisma } from '../utils/prisma.js';
import { MovementType, ItemStatus } from '../types/enums.js';
import { AlertService } from './alertService.js';
import { Prisma } from '@prisma/client';

export class LedgerService {
  static async getItemStockAtLocation(
    itemId: string,
    locationId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<number> {
    const movements = await tx.stockMovement.findMany({
      where: {
        itemId,
        OR: [
          { destinationLocationId: locationId },
          { sourceLocationId: locationId },
        ],
      },
      select: {
        type: true,
        quantity: true,
        sourceLocationId: true,
        destinationLocationId: true,
      },
    });

    let stock = 0;
    for (const m of movements) {
      if (m.type === MovementType.RECEIPT && m.destinationLocationId === locationId) {
        stock += m.quantity;
      } else if (m.type === MovementType.ISSUE && m.sourceLocationId === locationId) {
        stock -= m.quantity;
      } else if (m.type === MovementType.TRANSFER) {
        if (m.destinationLocationId === locationId) {
          stock += m.quantity;
        }
        if (m.sourceLocationId === locationId) {
          stock -= m.quantity;
        }
      } else if (m.type === MovementType.ADJUSTMENT && m.destinationLocationId === locationId) {
        stock += m.quantity;
      }
    }

    return stock;
  }

  static async getItemTotalStock(
    itemId: string,
    tx: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<number> {
    const movements = await tx.stockMovement.findMany({
      where: { itemId },
      select: {
        type: true,
        quantity: true,
      },
    });

    let stock = 0;
    for (const m of movements) {
      if (m.type === MovementType.RECEIPT) {
        stock += m.quantity;
      } else if (m.type === MovementType.ISSUE) {
        stock -= m.quantity;
      } else if (m.type === MovementType.ADJUSTMENT) {
        stock += m.quantity;
      }
    }

    return stock;
  }

  static async getItemStockBreakdown(itemId: string) {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, type: true },
    });

    const breakdown = await Promise.all(
      locations.map(async (loc) => {
        const stock = await this.getItemStockAtLocation(itemId, loc.id);
        return {
          locationId: loc.id,
          locationName: loc.name,
          locationCode: loc.code,
          locationType: loc.type,
          stock,
        };
      })
    );

    const totalStock = breakdown.reduce((acc, curr) => acc + curr.stock, 0);

    return {
      breakdown,
      totalStock,
    };
  }

  static async recordReceipt(data: {
    itemId: string;
    destinationLocationId: string;
    quantity: number;
    userId: string;
    reference?: string;
    notes?: string;
  }) {
    if (data.quantity <= 0) {
      throw new Error('Receipt quantity must be greater than 0.');
    }

    const item = await prisma.item.findUnique({
      where: { id: data.itemId },
    });

    if (!item) throw new Error('Item not found.');
    if (item.status === ItemStatus.ARCHIVED) {
      throw new Error('Cannot receive stock for an archived item.');
    }

    const location = await prisma.location.findUnique({
      where: { id: data.destinationLocationId },
    });
    if (!location || !location.isActive) {
      throw new Error('Destination location not found or inactive.');
    }

    const movement = await prisma.stockMovement.create({
      data: {
        itemId: data.itemId,
        type: MovementType.RECEIPT,
        quantity: data.quantity,
        destinationLocationId: data.destinationLocationId,
        userId: data.userId,
        reference: data.reference,
        notes: data.notes,
      },
      include: {
        item: true,
        destinationLocation: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    const totalStock = await this.getItemTotalStock(data.itemId);
    await AlertService.evaluateItemStockAlert(data.itemId, totalStock);

    return movement;
  }

  static async recordIssue(data: {
    itemId: string;
    sourceLocationId: string;
    quantity: number;
    userId: string;
    reference?: string;
    notes?: string;
  }) {
    if (data.quantity <= 0) {
      throw new Error('Issue quantity must be greater than 0.');
    }

    const item = await prisma.item.findUnique({
      where: { id: data.itemId },
    });

    if (!item) throw new Error('Item not found.');
    if (item.status === ItemStatus.ARCHIVED) {
      throw new Error('Cannot issue stock for an archived item.');
    }

    const location = await prisma.location.findUnique({
      where: { id: data.sourceLocationId },
    });
    if (!location || !location.isActive) {
      throw new Error('Source location not found or inactive.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const currentStock = await this.getItemStockAtLocation(data.itemId, data.sourceLocationId, tx);

      if (currentStock < data.quantity) {
        throw new Error(
          `Insufficient stock at ${location.name}. Available: ${currentStock}, Requested: ${data.quantity}.`
        );
      }

      const movement = await tx.stockMovement.create({
        data: {
          itemId: data.itemId,
          type: MovementType.ISSUE,
          quantity: data.quantity,
          sourceLocationId: data.sourceLocationId,
          userId: data.userId,
          reference: data.reference,
          notes: data.notes,
        },
        include: {
          item: true,
          sourceLocation: true,
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      return movement;
    });

    const totalStock = await this.getItemTotalStock(data.itemId);
    await AlertService.evaluateItemStockAlert(data.itemId, totalStock);

    return result;
  }

  static async recordTransfer(data: {
    itemId: string;
    sourceLocationId: string;
    destinationLocationId: string;
    quantity: number;
    userId: string;
    reference?: string;
    notes?: string;
  }) {
    if (data.quantity <= 0) {
      throw new Error('Transfer quantity must be greater than 0.');
    }

    if (data.sourceLocationId === data.destinationLocationId) {
      throw new Error('Source and destination locations cannot be the same.');
    }

    const item = await prisma.item.findUnique({
      where: { id: data.itemId },
    });

    if (!item) throw new Error('Item not found.');
    if (item.status === ItemStatus.ARCHIVED) {
      throw new Error('Cannot transfer stock for an archived item.');
    }

    const [sourceLoc, destLoc] = await Promise.all([
      prisma.location.findUnique({ where: { id: data.sourceLocationId } }),
      prisma.location.findUnique({ where: { id: data.destinationLocationId } }),
    ]);

    if (!sourceLoc || !sourceLoc.isActive) {
      throw new Error('Source location not found or inactive.');
    }
    if (!destLoc || !destLoc.isActive) {
      throw new Error('Destination location not found or inactive.');
    }

    const movement = await prisma.$transaction(async (tx) => {
      const sourceStock = await this.getItemStockAtLocation(data.itemId, data.sourceLocationId, tx);

      if (sourceStock < data.quantity) {
        throw new Error(
          `Insufficient stock at ${sourceLoc.name} to complete transfer. Available: ${sourceStock}, Requested: ${data.quantity}.`
        );
      }

      return tx.stockMovement.create({
        data: {
          itemId: data.itemId,
          type: MovementType.TRANSFER,
          quantity: data.quantity,
          sourceLocationId: data.sourceLocationId,
          destinationLocationId: data.destinationLocationId,
          userId: data.userId,
          reference: data.reference,
          notes: data.notes,
        },
        include: {
          item: true,
          sourceLocation: true,
          destinationLocation: true,
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });
    });

    return movement;
  }

  static async recordAdjustment(data: {
    itemId: string;
    locationId: string;
    deltaQuantity: number;
    userId: string;
    reference?: string;
    notes: string;
  }) {
    if (data.deltaQuantity === 0) {
      throw new Error('Adjustment quantity delta cannot be zero.');
    }

    if (!data.notes || data.notes.trim().length === 0) {
      throw new Error('A detailed reason/notes is mandatory for stock adjustments.');
    }

    const item = await prisma.item.findUnique({
      where: { id: data.itemId },
    });

    if (!item) throw new Error('Item not found.');
    if (item.status === ItemStatus.ARCHIVED) {
      throw new Error('Cannot adjust stock for an archived item.');
    }

    const location = await prisma.location.findUnique({
      where: { id: data.locationId },
    });
    if (!location || !location.isActive) {
      throw new Error('Location not found or inactive.');
    }

    const movement = await prisma.$transaction(async (tx) => {
      const currentStock = await this.getItemStockAtLocation(data.itemId, data.locationId, tx);
      const projectedStock = currentStock + data.deltaQuantity;

      if (projectedStock < 0) {
        throw new Error(
          `Adjustment of ${data.deltaQuantity} would result in negative stock (${projectedStock}) at ${location.name}. Current stock: ${currentStock}.`
        );
      }

      return tx.stockMovement.create({
        data: {
          itemId: data.itemId,
          type: MovementType.ADJUSTMENT,
          quantity: data.deltaQuantity,
          destinationLocationId: data.locationId,
          userId: data.userId,
          reference: data.reference,
          notes: data.notes,
        },
        include: {
          item: true,
          destinationLocation: true,
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });
    });

    const totalStock = await this.getItemTotalStock(data.itemId);
    await AlertService.evaluateItemStockAlert(data.itemId, totalStock);

    return movement;
  }
}
