import { Router } from 'express';
import {
  listInventory,
  getItemById,
  createItem,
  updateItem,
  archiveItem,
  restoreItem,
  getItemTimeline,
} from '../controllers/itemController.js';
import { authenticate } from '../middleware/auth.js';
import { requireManager } from '../middleware/role.js';

const router = Router();

router.use(authenticate);

router.get('/', listInventory);
router.get('/:id', getItemById);
router.get('/:id/timeline', getItemTimeline);

router.post('/', requireManager, createItem);
router.put('/:id', requireManager, updateItem);
router.patch('/:id/archive', requireManager, archiveItem);
router.patch('/:id/restore', requireManager, restoreItem);

export default router;
