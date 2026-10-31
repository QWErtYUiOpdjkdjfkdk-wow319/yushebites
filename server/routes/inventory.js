import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getProducts, addProduct, updateInventory, deleteInventory } from '../controllers/inventoryController.js';

const router = express.Router();

router.get('/', authMiddleware, getProducts);
router.post('/', authMiddleware, addProduct);
router.put('/:id', authMiddleware, updateInventory);
router.delete('/:id', authMiddleware, deleteInventory);

export default router;