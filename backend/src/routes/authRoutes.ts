import { Router } from 'express';
import { register, login, getMe, listUsers, assignStaffLocations } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { requireManager } from '../middleware/role.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, requireManager, listUsers);
router.post('/assign-locations', authenticate, requireManager, assignStaffLocations);

export default router;
