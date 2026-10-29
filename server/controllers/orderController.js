import OrderModel from "../models/Order.js";
import { getIO } from "../socket.js";

const generateOrderId = () => "ORD-" + Math.floor(1000 + Math.random() * 9000);

// PUBLIC: called by the customer mobile app
const createOrder = async (req, res) => {
    try {
        const { items, paymentMethod } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Order must contain items" });
        }
        if (!["CASH", "E-WALLET"].includes(paymentMethod)) {
            return res.status(400).json({ success: false, message: "Invalid payment method" });
        }

        const cleanItems = items.map((i) => ({
            productId: Number(i.productId),
            name: String(i.name),
            price: Number(i.price),
            qty: Math.max(1, parseInt(i.qty, 10) || 1),
        }));
        const total = cleanItems.reduce((sum, i) => sum + i.price * i.qty, 0);

        // Retry if the random order ID happens to collide
        let order = null;
        for (let attempt = 0; attempt < 5 && !order; attempt++) {
            try {
                order = await OrderModel.create({
                    orderId: generateOrderId(),
                    items: cleanItems,
                    total,
                    paymentMethod,
                });
            } catch (error) {
                if (error.code !== 11000) throw error;
            }
        }
        if (!order) {
            return res.status(500).json({ success: false, message: "Could not generate order ID" });
        }

        // Real-time push to every open admin dashboard
        getIO()?.emit("order:new", order);

        return res.status(201).json({ success: true, order });
    } catch (error) {
        console.error("Error creating order:", error);
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

// ADMIN: change order status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await OrderModel.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        getIO()?.emit("order:updated", order);
        return res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("Error updating order:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export { createOrder, getOrders, updateOrderStatus };
