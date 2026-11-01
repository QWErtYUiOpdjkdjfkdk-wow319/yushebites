import inventoryModel from "../models/Inventory.js";
import OrderModel from "../models/Order.js";

const getData = async (req, res) => {
    try {
        const totalProducts = await inventoryModel.countDocuments();

        const stockResult = await inventoryModel.aggregate([
            { $group: { _id: null, totalStock: { $sum: "$stock" } } }
        ])

        const totalStock = stockResult[0]?.totalStock || 0;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const ordersToday = await OrderModel.countDocuments({
            orderDate: { $gte: startOfDay, $ite: endOfDay }
        })

        const revenueResult = await OrderModel.aggregate([
            { $group: { _id: null, totalRevenue: { $sum: `$totalPrice` } } }
        ])
        const revenue = revenueResult[0]?.totalRevenue || 0;

        const outOfStock = await inventoryModel.find({ stock: 0 })
            .select('name stock')
            .populate('categoryId', 'categoryName')

        const highestSaleResult = await OrderModel.aggregate([
            { $group: { _id: '$product', totalQuantity: { $sum: `$quantity` } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: "inventory",
                    localField: '_id',
                    foreignField: '_id',
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $lookup: {
                    from: "categories",
                    localField: "inventory.categoryId",
                    foreignField: "_id",
                    as: "product.categoryId"
                }
            },
            { $unwind: "$product.categoryId" },
            {
                $project: {
                    name: "$product.name",
                    category: "$product.categoryId.categoryName",
                    totalQuantity: 1,
                }
            }
        ])

        const highestSaleProduct = highestSaleResult[0] || { message: "Data Unavailable" };

        const lowStock = await inventoryModel.find({ stock: { $gt: 0, $lt: 5 } })
            .select("name stock")
            .populate("categoryId", "categoryName");

        const dashboardData = {
            totalProducts,
            totalStock,
            ordersToday,
            revenue,
            outOfStock,
            highestSaleProduct,
            lowStock
        }

        return res.status(200).json({ success: true, dashboardData })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error when fetching dashboard summary" })
    }
}

export { getData };