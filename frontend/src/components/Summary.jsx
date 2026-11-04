import axios from "axios";
import { API_URL } from "../config";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";

const Summary = () => {
    const [dashboardData, setDashboardData] = useState({
        totalProducts: 0,
        totalStock: 0,
        ordersToday: 0,
        revenue: 0,
        outOfStock: [],
        highestSaleProduct: null,
        lowStock: []
    })
    const [loading, setLoading] = useState(false);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/dashboard`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('pos-token')}`
                }
            });
            setDashboardData(response.data.dashboardData);
        } catch (error) {
            alert(error.response?.data?.message || error.message);
        }finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if(loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="p-5">
            <h2 className='text-3xl font-bold'>Dashboard</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
                <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
                    <p className="text-lg font-semibold">Total Products</p>
                    <p className="text-2xl font-bold">{dashboardData.totalProducts}</p>
                </div>
                <div className="bg-green-500 text-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
                    <p className="text-lg font-semibold">Total Stock</p>
                    <p className="text-2xl font-bold">{dashboardData.totalStock}</p>
                </div>
                <div className="bg-yellow-500 text-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
                    <p className="text-lg font-semibold">Orders Today</p>
                    <p className="text-2xl font-bold">{dashboardData.ordersToday}</p>
                </div>
                <div className="bg-purple-500 text-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
                    <p className="text-lg font-semibold">Revenue</p>
                    <p className="text-2xl font-bold">₱{Number(dashboardData.revenue).toFixed(2)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        Out of Stock
                    </h3>
                    {dashboardData.outOfStock.length > 0 ? (
                        <ul className="space-y-2">
                            {dashboardData.outOfStock.map((inventory, index) => (
                                <li key={index} className="text-gray-600">
                                    {inventory.name}{" "}
                                    <span className="text-gray-400">({inventory.categoryId?.categoryName ?? "-"})</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">No product is currently out of stock 🎉</p>
                    )}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        Highest Sold Product
                    </h3>
                    {dashboardData.highestSaleProduct?.name ? (
                        <div className="text-gray-600">
                            <p><strong>Name:</strong> {dashboardData.highestSaleProduct.name}</p>
                            <p><strong>Category:</strong> {dashboardData.highestSaleProduct.category}</p>
                            <p><strong>Total Units Sold:</strong> {dashboardData.highestSaleProduct.totalQuantity}</p>
                        </div>
                    ) : (
                        <p className="text-gray-500">{dashboardData.highestSaleProduct?.message || 'Loading...'}</p>
                    )}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        Low Stock
                    </h3>
                    {dashboardData.lowStock.length > 0 ? (
                        <ul className="space-y-2">
                            {dashboardData.lowStock.map((inventory, index) => (
                                <li key={index} className="text-gray-600">
                                    <strong>{inventory.name}</strong> - <span className="text-red-500">{inventory.stock} left {" "}</span>
                                    <span className="text-gray-400">({inventory.categoryId?.categoryName ?? "-"})</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500">No product is low on stock</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Summary;