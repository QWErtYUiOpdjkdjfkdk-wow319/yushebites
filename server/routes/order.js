import express from "express";
import { createOrder, getOrders, updateOrderStatus } from "../controllers/orderController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Only admins may view or change orders
const adminOnly = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admins only" });
    }
    next();
};

router.post("/", createOrder); // public: customers have no login
router.get("/", authMiddleware, adminOnly, getOrders);
router.patch("/:id/status", authMiddleware, adminOnly, updateOrderStatus);

export default router;
