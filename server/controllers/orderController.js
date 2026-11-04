import mongoose from "mongoose";
import OrderModel from "../models/Order.js";
import Inventory from "../models/Inventory.js";
import { getIO } from "../socket.js";

const MAX_LINES = 50;
const MAX_QTY_PER_LINE = 99;
const STATUSES = ["pending", "preparing", "ready", "completed", "cancelled"];

const generateOrderId = () => "ORD-" + Math.floor(1000 + Math.random() * 9000);

// Give stock back (used when an order fails half-way or is cancelled)
const restoreStock = async (lines) => {
    for (const line of lines) {
        if (line.product) {
            await Inventory.updateOne({ _id: line.product }, { $inc: { stock: line.qty } });
        }
    }
};

// PUBLIC: called by the customer mobile app.
// The client only sends { productId, qty }. Name and price come from the database,
// so customers cannot change prices, and stock is reduced as part of placing the order.
const createOrder = async (req, res) => {
    const deducted = []; // lines whose stock has already been taken

    try {
        const { items, paymentMethod } = req.body;

        if (!Array.isArray(items) || items.length === 0 || items.length > MAX_LINES) {
            return res.status(400).json({ success: false, message: "Order must contain items" });
        }
        if (!["CASH", "E-WALLET"].includes(paymentMethod)) {
            return res.status(400).json({ success: false, message: "Invalid payment method" });
        }

        // Merge duplicate lines and validate input
        const wanted = new Map(); // productId -> qty
        for (const item of items) {
            const productId = String(item?.productId ?? "");
            const qty = item?.qty; // must be a whole number (JSON number), not text like "2abc" or 1.5
            if (!mongoose.isValidObjectId(productId) || typeof qty !== "number" || !Number.isInteger(qty) || qty < 1) {
                return res.status(400).json({ success: false, message: "Invalid item in order" });
            }
            wanted.set(productId, (wanted.get(productId) || 0) + qty);
        }

        // Take stock one product at a time. The condition stock >= qty inside the update
        // makes this safe when two customers order the last item at the same moment.
        const lines = [];
        for (const [productId, qty] of wanted) {
            if (qty > MAX_QTY_PER_LINE) {
                await restoreStock(deducted);
                return res.status(400).json({ success: false, message: "Quantity too large" });
            }

            const product = await Inventory.findOneAndUpdate(
                { _id: productId, isDeleted: false, stock: { $gte: qty } },
                { $inc: { stock: -qty } },
                { new: true }
            );

            if (!product) {
                await restoreStock(deducted);
                // Work out a helpful message
                const current = await Inventory.findOne({ _id: productId, isDeleted: false });
                const message = !current
                    ? "An item in your order is no longer available."
                    : current.stock === 0
                        ? `${current.name} is sold out.`
                        : `Only ${current.stock} of ${current.name} left.`;
                return res.status(409).json({ success: false, code: "OUT_OF_STOCK", message });
            }

            const line = { product: product._id, name: product.name, price: product.price, qty };
            deducted.push(line);
            lines.push(line);
        }

        const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

        // Retry if the random order ID happens to collide
        let order = null;
        for (let attempt = 0; attempt < 5 && !order; attempt++) {
            try {
                order = await OrderModel.create({
                    orderId: generateOrderId(),
                    items: lines,
                    total,
                    paymentMethod,
                });
            } catch (error) {
                if (error.code !== 11000) throw error;
            }
        }
        if (!order) {
            await restoreStock(deducted);
            return res.status(500).json({ success: false, message: "Could not generate order ID" });
        }

        // Real-time push to every open admin dashboard
        getIO()?.emit("order:new", order);

        return res.status(201).json({ success: true, order });
    } catch (error) {
        console.error("Error creating order:", error);
        // Don't leave stock taken for an order that was never saved
        try { await restoreStock(deducted); } catch (e) { console.error("Stock restore failed:", e); }
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ADMIN: list orders
const getOrders = async (req, res) => {
    try {
        const filter = req.query.status ? { status: req.query.status } : {};
        const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).limit(200);
        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ success: false, message: "Server could not get orders" });
    }
};

// ADMIN: change order status. Cancelling an order puts its stock back.
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const existing = await OrderModel.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (existing.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "A cancelled order can't be changed. Ask the customer to order again.",
            });
        }

        let order;
        if (status === "cancelled") {
            // Only the request that actually flips the status gives the stock back (no double refund)
            order = await OrderModel.findOneAndUpdate(
                { _id: id, status: { $ne: "cancelled" } },
                { status: "cancelled" },
                { new: true }
            );
            if (!order) {
                return res.status(400).json({ success: false, message: "Order is already cancelled" });
            }
            await restoreStock(order.items);
        } else {
            order = await OrderModel.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        }

        getIO()?.emit("order:updated", order);
        return res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("Error updating order:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export { createOrder, getOrders, updateOrderStatus };
