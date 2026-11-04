import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        // New orders link to the Inventory product. Older orders only have the
        // numeric productId from the original hard-coded menu, so both are optional.
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
        productId: { type: Number },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        qty: { type: Number, required: true, min: 1 },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderId: { type: String, required: true, unique: true },
        items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
        total: { type: Number, required: true, min: 0 },
        paymentMethod: { type: String, enum: ["CASH", "E-WALLET"], required: true },
        status: {
            type: String,
            enum: ["pending", "preparing", "ready", "completed", "cancelled"],
            default: "pending",
        },
    },
    { timestamps: true }
);

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;
