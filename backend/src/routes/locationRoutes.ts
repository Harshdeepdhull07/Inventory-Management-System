import { Router } from 'express';
import {
  listLocations,
  createLocation,
  updateLocation,
  toggleLocationActive,
} from '../controllers/locationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireManager } from '../middleware/role.js';

const router = Router();

router.use(authenticate);

router.get('/', listLocations);
router.post('/', requireManager, createLocation);
router.put('/:id', requireManager, updateLocation);
router.patch('/:id/toggle', requireManager, toggleLocationActive);

export default router;
