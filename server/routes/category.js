import express from 'express';
import { addCategory, getCategories, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminOnly.js';

const router = express.Router();

router.post('/add', authMiddleware, adminOnly, addCategory);
router.get('/', authMiddleware, adminOnly, getCategories);
router.put('/:id', authMiddleware, adminOnly, updateCategory);
router.delete('/:id', authMiddleware, adminOnly, deleteCategory);

export default router;