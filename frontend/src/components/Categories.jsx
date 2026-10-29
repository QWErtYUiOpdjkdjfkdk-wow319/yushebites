import { API_URL } from "../config";
import axios from "axios";
import React, { useEffect, useState } from "react";

const Categories = () => {
    const [categoryName, setCategoryName] = useState("");
    const [categoryDescription, setCategoryDescription] = useState("");
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editCategory, setEditCategory] = useState(null);

    // Isolated fetch function so it can be called on mount AND after form submissions
    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/category`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
                },
            });
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error("Error when fetching categories", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editCategory) {
            try {
                const response = await axios.put(
                    `${API_URL}/api/category/${editCategory}`,
                    { categoryName, categoryDescription },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
                        },
                    }
                );

                if (response.data.success) {
                    setEditCategory(null);
                    setCategoryName("");
                    setCategoryDescription("");
                    alert("Category updated successfully");
                    fetchCategories();
                }
            } catch (error) {
                const serverMessage = error.response?.data?.message || "Something went wrong";
                console.error("Error updating category:", serverMessage);
                alert(`Error updating category: ${serverMessage}`);
            }
        } else {
            try {
                const response = await axios.post(
                    `${API_URL}/api/category/add`,
                    { categoryName, categoryDescription },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
                        },
                    }
                );

                if (response.data.success) {
                    setCategoryName("");
                    setCategoryDescription("");
                    alert("Category added successfully");
                    fetchCategories();
                }
            } catch (error) {
                const serverMessage = error.response?.data?.message || "Something went wrong";
                console.error("Error editing category:", serverMessage);
                alert(`Error editing category: ${serverMessage}`);
            }
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this category?"
        );
        if (confirmDelete) {
            try {
                const response = await axios.delete(
                    `${API_URL}/api/category/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
                        },
                    }
                );
                if (response.data.success) {
                    alert("Category deleted successfully");
                    fetchCategories();
                } else {
                    console.error("Error deleting category", response.data);
                    alert("Error deleting category");
                }
            } catch (error) {
                console.error("Error deleting category", error);
                alert("Error deleting category");
            }
        }
    }

    const handleEdit = async (category) => {
        setEditCategory(category._id);
        setCategoryName(category.categoryName);
        setCategoryDescription(category.categoryDescription);
    }

    const handleCancel = async () => {
        setEditCategory(null);
        setCategoryName("");
        setCategoryDescription("");
    };

    if (loading) return <div className="p-4 font-bold text-center">Loading categories...</div>

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-8">Category Management</h1>

            <div className="flex flex-col lg:flex-row gap-4">
                {/* Form Wrapper Container */}
                <div className="lg:w-1/3">
                    <div className="bg-white shadow-md rounded-lg p-4">
                        <h2 className="text-center text-xl font-bold mb-4">{editCategory ? "Edit Category" : "Add Category"}</h2>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <input
                                    type="text"
                                    placeholder="Category Name"
                                    value={categoryName}
                                    className="border w-full p-2 rounded-md"
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    placeholder="Category Description"
                                    value={categoryDescription}
                                    className="border w-full p-2 rounded-md"
                                    onChange={(e) => setCategoryDescription(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    type="submit"
                                    className="w-full rounded-md bg-green-500 text-white p-3 cursor-pointer transition-colors duration-150 hover:bg-green-600">
                                    {editCategory ? "Save Changes" : "Add Category"}
                                </button>
                                {editCategory && (
                                    <button
                                        type="button"
                                        className="w-full rounded-md bg-red-500 text-white p-3 cursor-pointer hover:bg-red-600"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </button>
                                )
                                }
                            </div>
                        </form>
                    </div>
                </div>

                {/* Table Layout Container */}
                <div className="lg:w-2/3">
                    <div className="bg-white shadow-md rounded-lg p-4 overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200 text-left">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-200 p-2">S No</th>
                                    <th className="border border-gray-200 p-2">Category Name</th>
                                    <th className="border border-gray-200 p-2 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center p-4 text-gray-500">
                                            No categories found. Add your first one!
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((category, index) => (
                                        //Changed key mappings from .id to MongoDB's natural ._id syntax
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border border-gray-200 p-2 text-gray-600">{index + 1}</td>
                                            <td className="border border-gray-200 p-2 font-medium">{category.categoryName}</td>
                                            <td className="border border-gray-200 p-2 text-center space-x-2">
                                                <button className="bg-blue-500 text-white px-3 py-1 rounded-md transition-colors duration-150 hover:bg-blue-600 cursor-pointer"
                                                    onClick={() => handleEdit(category)}>Edit</button>
                                                <button className="bg-red-500 text-white px-3 py-1 rounded-md transition-colors duration-150 hover:bg-red-600 cursor-pointer"
                                                    onClick={() => handleDelete(category._id)}
                                                >Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Categories;