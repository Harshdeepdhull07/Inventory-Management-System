import { Request, Response } from 'express';
import { CsvService } from '../services/csvService.js';

export const importItems = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'Please upload a CSV file.' });
    return;
  }

  const summary = await CsvService.importItems(req.file.buffer);

  res.status(200).json({
    success: true,
    message: `CSV Processing Completed: ${summary.importedCount} imported, ${summary.failedCount} failed.`,
    data: summary,
  });
};

export const importReceipts = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'Please upload a CSV file.' });
    return;
  }

  const summary = await CsvService.importReceipts(req.file.buffer, req.user!.id);

  res.status(200).json({
    success: true,
    message: `Receipts Processing Completed: ${summary.importedCount} imported, ${summary.failedCount} failed.`,
    data: summary,
  });
};

export const exportInventory = async (_req: Request, res: Response): Promise<void> => {
  const csvContent = await CsvService.exportInventoryCsv();

  const filename = `inventory-snapshot-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csvContent);
};
