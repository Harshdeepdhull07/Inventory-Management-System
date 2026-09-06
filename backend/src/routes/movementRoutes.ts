import { Router } from 'express';
import {
  createReceipt,
  createIssue,
  createTransfer,
  createAdjustment,
  listMovements,
} from '../controllers/movementController.js';
import { authenticate } from '../middleware/auth.js';
import { requireManager, requireLocationAccess } from '../middleware/role.js';

const router = Router();

router.use(authenticate);

router.get('/', listMovements);

// Receipts require access to destination location for staff
router.post(
  '/receipt',
  requireLocationAccess((req) => req.body.destinationLocationId),
  createReceipt
);

// Issues require access to source location for staff
router.post(
  '/issue',
  requireLocationAccess((req) => req.body.sourceLocationId),
  createIssue
);

// Transfers require access to source location for staff
router.post(
  '/transfer',
  requireLocationAccess((req) => [req.body.sourceLocationId, req.body.destinationLocationId]),
  createTransfer
);

// Adjustments are strictly Manager-only
router.post('/adjustment', requireManager, createAdjustment);

export default router;
