import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminOnly.js';
import { getProducts, addProduct, updateInventory, deleteInventory } from '../controllers/inventoryController.js';

const router = express.Router();

router.get('/', authMiddleware, adminOnly, getProducts);
router.post('/', authMiddleware, adminOnly, addProduct);
router.put('/:id', authMiddleware, adminOnly, updateInventory);
router.delete('/:id', authMiddleware, adminOnly, deleteInventory);

export default router;