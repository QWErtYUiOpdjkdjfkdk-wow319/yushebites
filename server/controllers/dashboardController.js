import inventoryModel from "../models/Inventory.js";
import OrderModel from "../models/Order.js";

const getData = async (req, res) => {
    try {
        const activeProducts = { isDeleted: false };

        const totalProducts = await inventoryModel.countDocuments(activeProducts);

        const stockResult = await inventoryModel.aggregate([
            { $match: activeProducts },
            { $group: { _id: null, totalStock: { $sum: "$stock" } } }
        ]);
        const totalStock = stockResult[0]?.totalStock || 0;

        // Orders placed today (server time; set TZ on the host if you need another timezone)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const ordersToday = await OrderModel.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: "cancelled" }
        });

        // Revenue from all non-cancelled orders
        const revenueResult = await OrderModel.aggregate([
            { $match: { status: { $ne: "cancelled" } } },
            { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
        ]);
        const revenue = revenueResult[0]?.totalRevenue || 0;

        const outOfStock = await inventoryModel.find({ ...activeProducts, stock: 0 })
            .select("name stock")
            .populate("categoryId", "categoryName");

        const lowStock = await inventoryModel.find({ ...activeProducts, stock: { $gt: 0, $lt: 5 } })
            .select("name stock")
            .populate("categoryId", "categoryName");

        // Best-selling product, counted from the items inside each order
        const topSellers = await OrderModel.aggregate([
            { $match: { status: { $ne: "cancelled" } } },
            { $unwind: "$items" },
            { $group: { _id: "$items.name", totalQuantity: { $sum: "$items.qty" } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, name: "$_id", totalQuantity: 1 } }
        ]);

        let highestSaleProduct = { message: "Data Unavailable" };
        if (topSellers[0]) {
            const match = await inventoryModel.findOne({ name: topSellers[0].name })
                .populate("categoryId", "categoryName");
            highestSaleProduct = {
                name: topSellers[0].name,
                category: match?.categoryId?.categoryName || "-",
                totalQuantity: topSellers[0].totalQuantity
            };
        }

        return res.status(200).json({
            success: true,
            dashboardData: { totalProducts, totalStock, ordersToday, revenue, outOfStock, highestSaleProduct, lowStock }
        });
    } catch (error) {
        console.error("Dashboard summary error:", error);
        return res.status(500).json({ success: false, message: "Error when fetching dashboard summary" });
    }
};

export { getData };
