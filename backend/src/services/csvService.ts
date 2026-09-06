import { Readable } from 'stream';
import csvParser from 'csv-parser';
import * as fastCsv from 'fast-csv';
import { prisma } from '../utils/prisma.js';
import { LedgerService } from './ledgerService.js';
import { ItemStatus } from '../types/enums.js';

export interface RowImportResult {
  rowNumber: number;
  identifier: string;
  status: 'SUCCESS' | 'FAILED';
  message: string;
}

export class CsvService {
  static parseCsvBuffer(buffer: Buffer): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      const results: Record<string, string>[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }))
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });
  }

  static async importItems(buffer: Buffer) {
    const records = await this.parseCsvBuffer(buffer);
    const results: RowImportResult[] = [];
    let importedCount = 0;
    let failedCount = 0;

    const categories = await prisma.category.findMany();
    const categoryMap = new Map<string, string>();
    categories.forEach((cat) => categoryMap.set(cat.name.toLowerCase().trim(), cat.id));

    const existingItems = await prisma.item.findMany({ select: { sku: true } });
    const existingSkus = new Set<string>(existingItems.map((i) => i.sku.toUpperCase().trim()));

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2;
      const rawSku = row.SKU || row.sku || row['Item Code'] || '';
      const sku = rawSku.trim().toUpperCase();
      const name = (row.Name || row.name || row['Item Name'] || '').trim();
      const description = (row.Description || row.description || '').trim();
      const unit = (row.Unit || row.unit || 'pcs').trim();
      const reorderLevelStr = row.ReorderLevel || row.reorderLevel || row['Reorder Level'] || '10';
      const categoryName = (row.Category || row.category || row['Category Name'] || '').trim();

      if (!sku) {
        failedCount++;
        results.push({ rowNumber, identifier: 'Unknown', status: 'FAILED', message: 'Missing SKU.' });
        continue;
      }

      if (!name) {
        failedCount++;
        results.push({ rowNumber, identifier: sku, status: 'FAILED', message: 'Missing item name.' });
        continue;
      }

      if (existingSkus.has(sku)) {
        failedCount++;
        results.push({ rowNumber, identifier: sku, status: 'FAILED', message: `Duplicate SKU '${sku}' already exists.` });
        continue;
      }

      const reorderLevel = parseInt(reorderLevelStr, 10);
      if (isNaN(reorderLevel) || reorderLevel < 0) {
        failedCount++;
        results.push({ rowNumber, identifier: sku, status: 'FAILED', message: `Invalid ReorderLevel '${reorderLevelStr}'. Must be non-negative integer.` });
        continue;
      }

      let categoryId = categoryMap.get(categoryName.toLowerCase());
      if (!categoryId) {
        if (categoryName.length > 0) {
          const newCat = await prisma.category.create({
            data: { name: categoryName, description: 'Created via CSV Import' },
          });
          categoryMap.set(categoryName.toLowerCase(), newCat.id);
          categoryId = newCat.id;
        } else {
          let generalCat = categoryMap.get('general');
          if (!generalCat) {
            const newCat = await prisma.category.create({
              data: { name: 'General', description: 'Default Category' },
            });
            categoryMap.set('general', newCat.id);
            generalCat = newCat.id;
          }
          categoryId = generalCat;
        }
      }

      try {
        await prisma.item.create({
          data: {
            sku,
            name,
            description: description || null,
            unit: unit || 'pcs',
            reorderLevel,
            categoryId,
            status: ItemStatus.ACTIVE,
          },
        });

        existingSkus.add(sku);
        importedCount++;
        results.push({
          rowNumber,
          identifier: sku,
          status: 'SUCCESS',
          message: `Imported item '${name}' (${sku}) successfully.`,
        });
      } catch (err: any) {
        failedCount++;
        results.push({
          rowNumber,
          identifier: sku,
          status: 'FAILED',
          message: err.message || 'Failed to create item in database.',
        });
      }
    }

    return {
      totalRows: records.length,
      importedCount,
      failedCount,
      results,
    };
  }

  static async importReceipts(buffer: Buffer, userId: string) {
    const records = await this.parseCsvBuffer(buffer);
    const results: RowImportResult[] = [];
    let importedCount = 0;
    let failedCount = 0;

    const items = await prisma.item.findMany({ select: { id: true, sku: true, status: true } });
    const itemMap = new Map<string, { id: string; status: string }>();
    items.forEach((item) => itemMap.set(item.sku.toUpperCase().trim(), { id: item.id, status: item.status }));

    const locations = await prisma.location.findMany({ select: { id: true, name: true, code: true, isActive: true } });
    const locationMap = new Map<string, string>();
    locations.forEach((loc) => {
      locationMap.set(loc.name.toLowerCase().trim(), loc.id);
      locationMap.set(loc.code.toLowerCase().trim(), loc.id);
    });

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2;
      const sku = (row.SKU || row.sku || '').trim().toUpperCase();
      const locationInput = (row.Location || row.location || row['Location Code'] || row['Location Name'] || '').trim();
      const qtyStr = row.Quantity || row.quantity || row.Qty || row.qty || '0';
      const reference = (row.Reference || row.reference || row.Ref || 'CSV Receipt Import').trim();
      const notes = (row.Notes || row.notes || '').trim();

      if (!sku) {
        failedCount++;
        results.push({ rowNumber, identifier: 'Unknown', status: 'FAILED', message: 'Missing SKU.' });
        continue;
      }

      const itemInfo = itemMap.get(sku);
      if (!itemInfo) {
        failedCount++;
        results.push({ rowNumber, identifier: sku, status: 'FAILED', message: `Item with SKU '${sku}' does not exist.` });
        continue;
      }

      if (itemInfo.status === ItemStatus.ARCHIVED) {
        failedCount++;
        results.push({ rowNumber, identifier: sku, status: 'FAILED', message: `Item with SKU '${sku}' is archived.` });
        continue;
      }

      const locationId = locationMap.get(locationInput.toLowerCase());
      if (!locationId) {
        failedCount++;
        results.push({ rowNumber, identifier: sku, status: 'FAILED', message: `Location '${locationInput}' not found.` });
        continue;
      }

      const quantity = parseInt(qtyStr, 10);
      if (isNaN(quantity) || quantity <= 0) {
        failedCount++;
        results.push({ rowNumber, identifier: sku, status: 'FAILED', message: `Invalid quantity '${qtyStr}'. Must be positive integer.` });
        continue;
      }

      try {
        await LedgerService.recordReceipt({
          itemId: itemInfo.id,
          destinationLocationId: locationId,
          quantity,
          userId,
          reference,
          notes,
        });

        importedCount++;
        results.push({
          rowNumber,
          identifier: `${sku} -> ${locationInput}`,
          status: 'SUCCESS',
          message: `Received ${quantity} units of ${sku}.`,
        });
      } catch (err: any) {
        failedCount++;
        results.push({
          rowNumber,
          identifier: sku,
          status: 'FAILED',
          message: err.message || 'Failed to record receipt.',
        });
      }
    }

    return {
      totalRows: records.length,
      importedCount,
      failedCount,
      results,
    };
  }

  static async exportInventoryCsv(): Promise<string> {
    const items = await prisma.item.findMany({
      include: {
        category: true,
      },
      orderBy: { sku: 'asc' },
    });

    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const exportRows: any[] = [];

    for (const item of items) {
      for (const loc of locations) {
        const stock = await LedgerService.getItemStockAtLocation(item.id, loc.id);
        exportRows.push({
          SKU: item.sku,
          ItemName: item.name,
          Category: item.category.name,
          LocationName: loc.name,
          LocationCode: loc.code,
          CurrentStock: stock,
          Unit: item.unit,
          ReorderLevel: item.reorderLevel,
          Status: item.status,
        });
      }
    }

    return fastCsv.writeToString(exportRows, { headers: true });
  }
}
