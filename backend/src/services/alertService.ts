import { prisma } from '../utils/prisma.js';
import { AlertStatus } from '../types/enums.js';

export class AlertService {
  static async evaluateItemStockAlert(itemId: string, currentStock: number): Promise<void> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { id: true, reorderLevel: true, status: true },
    });

    if (!item || item.status === 'ARCHIVED') {
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
        await prisma.lowStockAlert.update({
          where: { id: existingAlert.id },
          data: {
            currentStock,
            reorderLevel: item.reorderLevel,
            ...(currentStock < existingAlert.currentStock && { status: AlertStatus.ACTIVE }),
          },
        });
      }
    } else {
      await prisma.lowStockAlert.updateMany({
        where: { itemId, status: { in: [AlertStatus.ACTIVE, AlertStatus.DISMISSED] } },
        data: { status: AlertStatus.RESOLVED },
      });
    }
  }

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
