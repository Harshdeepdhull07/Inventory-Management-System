import { Router } from 'express';
import multer from 'multer';
import { importItems, importReceipts, exportInventory } from '../controllers/csvController.js';
import { authenticate } from '../middleware/auth.js';
import { requireManager } from '../middleware/role.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.post('/import-items', requireManager, upload.single('file'), importItems);
router.post('/import-receipts', upload.single('file'), importReceipts);
router.get('/export', exportInventory);

export default router;
