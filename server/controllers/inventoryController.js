// import Supplier from '../models/Supplier.js';
import Category from '../models/Category.js';
import Inventory from '../models/Inventory.js';
import mongoose from 'mongoose';

const addProduct = async (req, res) => {
    try {
        const { name, description, price, stock, categoryId, emoji } = req.body;

        const newInventory = new Inventory({
            name,
            description,
            price,
            stock,
            categoryId,
            emoji,
        });

        await newInventory.save();
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
        console.error('Error fetching products:', error);
        return res.status(500).json({ success: false, message: 'Server error when fetching products' });
    }
}

const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, categoryId, emoji } = req.body;

        const updatedInventory = await Inventory.findByIdAndUpdate(id, {
            name,
            description,
            price,
            stock,
            categoryId,
            emoji,
            //supplierId
        }, { new: true, runValidators: true });

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

const MAX_STOCK_CHANGE = 9999;

// Add or remove stock by a whole number (used by the QR scanner).
// body: { delta: 5 } adds 5, { delta: -2 } removes 2.
// The "stock >= amount" condition is part of the update itself, so two scans at the
// same moment can never push stock below zero (same approach as placing an order).
const adjustStock = async (req, res) => {
    try {
        const { id } = req.params;
        const delta = req.body?.delta;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
        if (typeof delta !== 'number' || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > MAX_STOCK_CHANGE) {
            return res.status(400).json({ success: false, message: `Change must be a whole number from 1 to ${MAX_STOCK_CHANGE}` });
        }

        const filter = { _id: id, isDeleted: false };
        if (delta < 0) filter.stock = { $gte: -delta };

        const updated = await Inventory.findOneAndUpdate(filter, { $inc: { stock: delta } }, { new: true })
            .populate('categoryId');

        if (!updated) {
            const current = await Inventory.findOne({ _id: id, isDeleted: false });
            if (!current) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            return res.status(409).json({
                success: false,
                message: `Only ${current.stock} of ${current.name} in stock, can't remove ${-delta}.`,
            });
        }

        return res.status(200).json({ success: true, inventory: updated });
    } catch (error) {
        console.error('Error adjusting stock:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

export { getProducts, addProduct, updateInventory, deleteInventory, adjustStock };
