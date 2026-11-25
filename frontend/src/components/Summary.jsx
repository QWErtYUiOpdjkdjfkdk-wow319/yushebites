import axios from "axios";
import { API_URL } from "../config";
import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom';

const Summary = () => {
  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - offset * 60 * 1000);
    return localToday.toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [timeframe, setTimeframe] = useState("daily"); // "daily" | "weekly" | "monthly"
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalStock: 0,
    ordersToday: 0,
    revenue: 0,
    outOfStock: [],
    highestSaleProduct: null,
    lowStock: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async (date, period) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/dashboard`, {
        params: { date, period }, // Sends ?date=YYYY-MM-DD&period=daily|weekly|monthly
        headers: {
          Authorization: `Bearer ${localStorage.getItem("pos-token")}`,
        },
      });
      setDashboardData(response.data.dashboardData);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedDate, timeframe);
  }, [selectedDate, timeframe]);

  const getCardTitle = () => {
    const isToday = selectedDate === getTodayDate();
    if (timeframe === "daily") {
      return isToday ? "Orders Today" : `Orders (${selectedDate})`;
    }
    if (timeframe === "weekly") {
      return `Weekly Orders`;
    }
    return `Monthly Orders`;
  };

  if (loading) {
    return <div className="p-5">Loading...</div>;
  }

  return (
    <div className="p-5">
      <h2 className="text-3xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
          <p className="text-lg font-semibold">Total Products</p>
          <p className="text-2xl font-bold">{dashboardData.totalProducts}</p>
        </div>

        <div className="bg-green-500 text-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center">
          <p className="text-lg font-semibold">Total Stock</p>
          <p className="text-2xl font-bold">{dashboardData.totalStock}</p>
        </div>

        <div className="bg-yellow-500 text-white p-4 rounded-lg shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 w-full mb-2">

            <input
              type="date"
              value={selectedDate}
              max={getTodayDate()}
              onChange={(e) => setSelectedDate(e.target.value)}
              title="Select reference date"
              className="bg-yellow-600/80 hover:bg-yellow-600 text-white text-xs font-medium rounded px-2 py-1 border border-white/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>

          <div className="text-center my-1">
            <p className="text-lg font-semibold">{getCardTitle()}</p>
            <p className="text-2xl font-bold">{dashboardData.ordersToday}</p>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-black/15 p-1 rounded-md mt-2">
            {["daily", "weekly", "monthly"].map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setTimeframe(period)}
                className={`text-xs font-semibold py-1 rounded capitalize transition cursor-pointer ${timeframe === period
                  ? "bg-white text-yellow-700 shadow-sm"
                  : "text-white hover:bg-white/20"
                  }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <Link to="admin-dashboard/sales" className="bg-purple-500 text-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center hover:opacity-90 transition-opacity">
          <p className="text-lg font-semibold">Revenue</p>
          <p className="text-2xl font-bold">
            ₱{Number(dashboardData.revenue).toFixed(2)}
          </p>
        </Link>
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
                  <span className="text-gray-400">
                    ({inventory.categoryId?.categoryName ?? "-"})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">
              No product is currently out of stock 🎉
            </p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Highest Sold Product
          </h3>
          {dashboardData.highestSaleProduct?.name ? (
            <div className="text-gray-600">
              <p>
                <strong>Name:</strong> {dashboardData.highestSaleProduct.name}
              </p>
              <p>
                <strong>Category:</strong>{" "}
                {dashboardData.highestSaleProduct.category}
              </p>
              <p>
                <strong>Total Units Sold:</strong>{" "}
                {dashboardData.highestSaleProduct.totalQuantity}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">
              {dashboardData.highestSaleProduct?.message || "Loading..."}
            </p>
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
                  <strong>{inventory.name}</strong> -{" "}
                  <span className="text-red-500">{inventory.stock} left </span>
                  <span className="text-gray-400">
                    ({inventory.categoryId?.categoryName ?? "-"})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No product is low on stock</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary;