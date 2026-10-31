// import Supplier from '../models/Supplier.js';
import Category from '../models/Category.js';
import Inventory from '../models/Inventory.js';

const addProduct = async (req, res) => {
    try {
        const { name, description, price, stock, categoryId, supplierId } = req.body;

        const newInventory = new Inventory({
            name,
            description,
            price,
            stock,
            categoryId,
            supplierId
        });

        await newProduct.save();
        return res.status(201).json({ success: true, message: 'Product added successfully' })
    } catch (error) {
        console.error('Error adding product', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const getProducts = async (req, res) => {
    try {
        const inventory = await Inventory.find({ isDeleted: false }).populate('categoryId')//.populate('supplierId')
            ;
        // const suppliers = await Supplier.find();
        const categories = await Category.find();
        return res.status(200).json({
            success: true, inventory, //suppliers,
            categories
        });
    } catch (error) {
        //     console.error('Error fetching data:', error);
        //     return res.status(500).json({ success: false, message: 'Server error when fetching suppliers' });
    }
}

const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, categoryId, supplierId } = req.body;

        const updatedInventory = await Inventory.findByIdAndUpdate(id, {
            name,
            description,
            price,
            stock,
            categoryId,
            //supplierId
        }, { new: true });

        if (!updatedInventory) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        return res.status(200).json({ success: true, message: 'Product updated successfully', inventory: updatedInventory });
    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

const deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;

        const existingInventory = await Inventory.findById(id);
        if (!existingInventory) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (existingInventory.isDeleted) {
            return res.status(400).json({ success: false, message: 'Product already deleted' });
        }
        await Inventory.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        return res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

export { getProducts, addProduct, updateInventory, deleteInventory };