import { Router } from 'express';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';
import { requireManager } from '../middleware/role.js';

const router = Router();

router.use(authenticate);

router.get('/', listCategories);
router.post('/', requireManager, createCategory);
router.put('/:id', requireManager, updateCategory);
router.delete('/:id', requireManager, deleteCategory);

export default router;
