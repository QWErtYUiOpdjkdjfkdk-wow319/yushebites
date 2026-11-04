import axios from "axios";
import { API_URL } from "../config";
import React, { useEffect, useState } from "react";

const Inventory = () => {
    const [openModal, setOpenModal] = useState(false);
    const [editInventory, setEditInventory] = useState(null);
    const [categories, setCategories] = useState([]);
    // const [suppliers, setSuppliers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [filteredInventory, setFilteredInventory] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        stock: "",
        categoryId: "",
        // supplierId: "",
    });

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/inventory`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
                },
            });
            if (response.data.success) {
                // setSuppliers(response.data.suppliers);
                setCategories(response.data.categories);
                setInventory(response.data.inventory);
                setFilteredInventory(response.data.inventory);
            } else {
                console.error("Error fetching products:", response.data.message);
                alert("Error fetching products. Please try again");
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleEdit = async (inventory) => {
        setOpenModal(true);
        setEditInventory(inventory._id);
        setFormData({
            name: inventory.name,
            description: inventory.description,
            price: inventory.price,
            stock: inventory.stock,
            categoryId: inventory.categoryId?._id ?? "",
            // supplierId: inventory.supplierId._id,
        })
    };

    const handleDelete = async (id) => {
        const comfirmDelete = window.confirm(
            "Are you sure you want to delete this product?");
        if (confirmDelete) {
            try {
                const response = await axios.delete(
                    `${API_URL}/api/inventory/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
                        },
                    }
                );
                if (response.data.success) {
                    alert("Product deleted successfully");
                    fetchProducts();
                } else {
                    console.error("Error deleting product:", data);
                    alert("Error deleting product. Please try again");
                }
            } catch (error) {
                console.error("Error deleting product:", data);
                alert("Error deleting product. Please try again");
            }
        }
    }

    const closeModal = () => {
        setOpenModal(false);
        setEditInventory(null);
        setFormData({
            name: "",
            description: "",
            price: "",
            stock: "",
            categoryId: "",
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (editInventory) {
            try {
                const response = await axios.put(
                    `${API_URL}/api/inventory/${editInventory}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
                        },
                    }
                );
                if (response.data.success) {
                    alert("Product updated successfully");
                    fetchProducts();
                    setOpenModal(false);
                    setEditInventory(null);
                    setFormData({
                        name: "",
                        description: "",
                        price: "",
                        stock: "",
                        categoryId: "",
                        //supplierId: "",
                    });
                } else {
                    alert("Error updating product. Please try again");
                }
            } catch (error) {
                alert("Error updating product. Please try again");
            }
            return;
        }
        else {
            try {
            } catch (error) {
                alert("Error adding product. Please try again");
            }
        }
        try {
            const response = await axios.post(
                `${API_URL}/api/inventory`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
                    },
                }
            );
            if (response.data.success) {
                fetchProducts();
                alert("Products added successfully");
                setOpenModal(false);
                setFormData({
                    name: "",
                    description: "",
                    price: "",
                    stock: "",
                    categoryId: "",
                    // supplierId: "",
                })
            } else {
                alert("Error adding product. Please try again.");
            }
        } catch (error) {
            alert("Error adding product");
        }
    }

    const handleSearch = (e) => {
        setFilteredInventory(
            inventory.filter((inventory) =>
            inventory.name.toLowerCase().includes(e.target.value.toLowerCase()))
        )
    }

    return (
        <div className="w-full h-full flex flex-col gap-4 p-4">
            <h1 className="text-2x1 font-bold">Inventory Management</h1>
            <div className="flex justify-between items-center">
                <input
                    type="text"
                    placeholder="Search"
                    className="border p-1 bg-white rounded px-4"
                    onChange={handleSearch}
                />
                <button
                    className="px-4 py-1.5 bg-blue-500 text-white rounded cursor-pointer"
                    onClick={() => setOpenModal(true)}
                >
                    Add Product
                </button>
            </div>

            <div>
                <table>
                    <thead>
                        <tr>
                            <th className="border border-gray-300 p-2">Product ID</th>
                            <th className="border border-gray-300 p-2">Name</th>
                            <th className="border border-gray-300 p-2">Category</th>
                            <th className="border border-gray-300 p-2">Supplier</th>
                            <th className="border border-gray-300 p-2">Price</th>
                            <th className="border border-gray-300 p-2">Stock</th>
                            <th className="border border-gray-300 p-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventory && filteredInventory.map((inventory, index) => (
                            <tr key={inventory._id}>
                                <td className="border border-gray-300 p-2">{index + 1}</td>
                                <td className="border border-gray-300 p-2">{inventory.name}</td>
                                <td className="border border-gray-300 p-2">{inventory.categoryId?.categoryName ?? "-"}</td>
                                <td className="border border-gray-300 p-2">
                                    {/* {inventory.supplierId.name} */}
                                </td>
                                <td className="border border-gray-300 p-2">
                                    {inventory.price}
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <span className="px-2 py-1 rounded-full font-semibold">
                                        {inventory.stock == 0 ? (
                                            <span className="bg-red-100 text-red-500 px-2 py-1 rounded-full">{inventory.stock}</span>
                                        ) : inventory.stock < 5 ? (
                                            <span className="bg-yellow-100 text-yellow-500 px-2 py-1 rounded-full">{inventory.stock}</span>
                                        ) : (
                                            <span className="bg-green-100 text-green-500 px-2 py-1 rounded-full">{inventory.stock}</span>
                                        )}
                                    </span>
                                </td>
                                <td className="border border-gray-300 p-2">
                                    <button
                                        className="px-2 py-1 bg-yellow-500 text-white rounded cursor-pointer mr-2"
                                        onClick={() => handleEdit(inventory)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="px-2 py-1 bg-red-500 text-white rounded cursor-pointer"
                                        onClick={() => handleDelete(inventory._id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredInventory.length === 0 && <div>No records</div>}
            </div>

            {openModal && (
                <div className="fixed top-0 left-0 w-full bg-black/50 flex justify-center items-center">
                    <div className="bg-white p-4 rounded shadow-md w-1/3 relative">
                        <h1 className="text-xl font-bold">Add Product</h1>
                        <button
                            className="absolute top-4 right-4 font-bold text-lg cursor-pointer"
                            onClick={closeModal}
                        >
                            X
                        </button>
                        <form className="flex flex-col-gap-4 mt-4" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Product Name"
                                className="border p-1 bg-white rounded px-4"
                            />
                            <input
                                type="text"
                                placeholder="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="border p-1 bg-white rounded px-4"
                            />
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="Enter Price"
                                className="border p-1 bg-white rounded px-4"
                            />
                            <input
                                type="number"
                                name="stock"
                                min="0"
                                value={formData.stock}
                                onChange={handleChange}
                                placeholder="Enter Stock"
                                className="border p-1 bg-white rounded px-4"
                            />
                            <div className="w-full border">
                                <select name="category" className="w-full p-2"
                                    onChange={handleChange} value={formData.categoryId}>
                                    <option value="">Select Category</option>
                                    {categories && categories.map((category) => (
                                        <option key={category._id} value={category._id}>
                                            {category.categoryName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full border">
                                <select name="supplier" className="w-full p-2"
                                    onChange={handleChange} value={formData.supplierId}>
                                    <option value="">Select Supplier</option>
                                    {/* {suppliers && suppliers.map((supplier) => (
                                        <option key={supplier._id} value={supplier._id}>
                                            {supplier.name}
                                        </option>
                                    ))} */}
                                </select>
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    type="submit"
                                    className="w-full mt-2 rounded-md bg-green-500 text-white p-3 cursor-pointer hover:bg-green-600"
                                >
                                    {editInventory ? "Save Changes" : "Add Product"}
                                </button>

                                <button
                                    type="button"
                                    className="w-full mt-2 rounded-md bg-red-500 text-white p-3 cursor-pointer hover:bg-red-600"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}