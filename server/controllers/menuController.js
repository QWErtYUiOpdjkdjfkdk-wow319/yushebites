import Inventory from "../models/Inventory.js";

// PUBLIC: the customer app loads its menu from here.
// Prices and stock always come from the Inventory page, so both stay in sync.
const getMenu = async (req, res) => {
    try {
        const products = await Inventory.find({ isDeleted: false })
            .populate("categoryId", "categoryName")
            .sort({ name: 1 })
            .lean();

        const categoryMap = new Map();
        const menuProducts = [];

        for (const p of products) {
            if (!p.categoryId) continue; // category was deleted: hide the product
            categoryMap.set(String(p.categoryId._id), p.categoryId.categoryName);
            menuProducts.push({
                id: String(p._id),
                name: p.name,
                description: p.description,
                price: p.price,
                stock: p.stock,
                emoji: p.emoji || "",
                categoryId: String(p.categoryId._id),
            });
        }

        const categories = [...categoryMap].map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));

        res.set("Cache-Control", "no-store");
        return res.status(200).json({ success: true, categories, products: menuProducts });
    } catch (error) {
        console.error("Error building menu:", error);
        return res.status(500).json({ success: false, message: "Could not load the menu" });
    }
};

export { getMenu };
