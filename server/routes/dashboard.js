import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import adminOnly from '../middleware/adminOnly.js';
import { getData } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/', authMiddleware, adminOnly, getData);

export default router