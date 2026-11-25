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

        // Parse date and period from query params (defaults to today + daily)
        const { date, period = "daily" } = req.query;

        // Parse YYYY-MM-DD safely in local server time to avoid UTC offset shifting
        let baseDate = new Date();
        if (date) {
            const [year, month, day] = date.split("-").map(Number);
            if (year && month && day) {
                baseDate = new Date(year, month - 1, day);
            }
        }

        const startDate = new Date(baseDate);
        const endDate = new Date(baseDate);

        if (period === "weekly") {
            // Week starting Sunday through Saturday of the selected date's week
            const dayOfWeek = baseDate.getDay(); // 0 (Sun) - 6 (Sat)
            startDate.setDate(baseDate.getDate() - dayOfWeek);
            startDate.setHours(0, 0, 0, 0);

            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
        } else if (period === "monthly") {
            // 1st day to last day of the selected date's month
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);

            endDate.setMonth(baseDate.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // Daily (default): 00:00:00.000 to 23:59:59.999 of selected date
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        }

        const ordersToday = await OrderModel.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: "cancelled" }
        });

        // Revenue from all non-cancelled orders (unchanged)
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
            dashboardData: {
                totalProducts,
                totalStock,
                ordersToday,
                revenue,
                outOfStock,
                highestSaleProduct,
                lowStock
            }
        });
    } catch (error) {
        console.error("Dashboard summary error:", error);
        return res.status(500).json({ success: false, message: "Error when fetching dashboard summary" });
    }
};

export { getData };