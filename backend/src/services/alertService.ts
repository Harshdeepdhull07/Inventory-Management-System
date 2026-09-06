import { prisma } from '../utils/prisma.js';
import { AlertStatus } from '@prisma/client';

export class AlertService {
  /**
   * Evaluates an item's current total stock against its reorder level.
   * Updates or creates low-stock alert records accordingly.
   */
  static async evaluateItemStockAlert(itemId: string, currentStock: number): Promise<void> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, reorderLevel: true, status: true },
    });

    if (!item || item.status === 'ARCHIVED') {
      // Clean up or resolve any alerts for archived/missing items
      await prisma.lowStockAlert.updateMany({
        where: { itemId, status: AlertStatus.ACTIVE },
        data: { status: AlertStatus.RESOLVED },
      });
      return;
    }

    const isLowStock = currentStock <= item.reorderLevel;

    if (isLowStock) {
      const existingAlert = await prisma.lowStockAlert.findFirst({
        where: { itemId, status: { in: [AlertStatus.ACTIVE, AlertStatus.DISMISSED] } },
        orderBy: { createdAt: 'desc' },
      });

      if (!existingAlert) {
        await prisma.lowStockAlert.create({
          data: {
            itemId,
            currentStock,
            reorderLevel: item.reorderLevel,
            status: AlertStatus.ACTIVE,
          },
        });
      } else {
        // If stock changed further downward or remains low, ensure it stays active or update stock
        await prisma.lowStockAlert.update({
          where: { id: existingAlert.id },
          data: {
            currentStock,
            reorderLevel: item.reorderLevel,
            // If it was dismissed but stock dropped further, reactivate
            ...(currentStock < existingAlert.currentStock && { status: AlertStatus.ACTIVE }),
          },
        });
      }
    } else {
      // Stock is healthy; resolve any existing alerts
      await prisma.lowStockAlert.updateMany({
        where: { itemId, status: { in: [AlertStatus.ACTIVE, AlertStatus.DISMISSED] } },
        data: { status: AlertStatus.RESOLVED },
      });
    }
  }

  /**
   * Dismiss an active alert
   */
  static async dismissAlert(alertId: string, userEmail: string): Promise<void> {
    await prisma.lowStockAlert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.DISMISSED,
        dismissedBy: userEmail,
        dismissedAt: new Date(),
      },
    });
  }

  /**
   * Get all active and dismissed alerts
   */
  static async getAlerts(includeDismissed = false) {
    return prisma.lowStockAlert.findMany({
      where: {
        status: includeDismissed ? { in: [AlertStatus.ACTIVE, AlertStatus.DISMISSED] } : AlertStatus.ACTIVE,
      },
      include: {
        item: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
