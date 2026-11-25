import { API_URL } from "../config";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const API = API_URL;

// Helper to format a Date object as YYYY-MM-DD in local time for <input type="date">
const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Sales = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("daily"); // "daily" | "weekly" | "monthly"
  const [selectedDate, setSelectedDate] = useState(() =>
    toLocalDateString(new Date())
  );

  const getAuthHeader = () => {
    const token = localStorage.getItem("pos-token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    const token = localStorage.getItem("pos-token");

    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API}/api/order`, getAuthHeader());
        setOrders(response.data.orders || []);
      } catch (error) {
        console.error("Error when fetching sales", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Keep sales updated in real time as orders are marked completed
    const socket = io(API, { auth: { token } });

    socket.on("order:new", (order) => {
      setOrders((prev) => {
        if (prev.some((o) => o._id === order._id)) return prev;
        return [order, ...prev];
      });
    });

    socket.on("order:updated", (order) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === order._id);
        return exists
          ? prev.map((o) => (o._id === order._id ? order : o))
          : [order, ...prev];
      });
    });

    return () => socket.disconnect();
  }, []);

  // Calculate start/end boundaries and filter only completed orders
  const { filteredSales, rangeLabel } = useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const anchor = new Date(year, month - 1, day);

    let start = new Date(anchor);
    let end = new Date(anchor);
    let label = "";

    if (period === "daily") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      label = anchor.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } else if (period === "weekly") {
      // Week starts on Sunday (change `anchor.getDay()` if you prefer Monday)
      const diffToSunday = anchor.getDay();
      start.setDate(anchor.getDate() - diffToSunday);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      label = `${start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })} – ${end.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    } else if (period === "monthly") {
      start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      end = new Date(year, month, 0, 23, 59, 59, 999);
      label = anchor.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }

    const matching = orders.filter((order) => {
      if (order.status !== "completed") return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });

    return { filteredSales: matching, rangeLabel: label };
  }, [orders, period, selectedDate]);

  // Summary metrics
  const totalRevenue = useMemo(
    () => filteredSales.reduce((sum, o) => sum + (o.total || 0), 0),
    [filteredSales]
  );

  const avgOrderValue =
    filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-sm text-gray-500">Showing sales for {rangeLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Daily / Weekly / Monthly Toggle */}
          <div className="inline-flex rounded-lg border bg-white p-1 shadow-sm">
            {["daily", "weekly", "monthly"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition ${
                  period === option
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
            className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">
            Total Revenue
          </p>
          <p className="text-2xl font-bold mt-1">
            ₱{totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">
            Completed Orders
          </p>
          <p className="text-2xl font-bold mt-1">{filteredSales.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">
            Average Order Value
          </p>
          <p className="text-2xl font-bold mt-1">
            ₱{avgOrderValue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Completed Orders Grid */}
      {filteredSales.length === 0 ? (
        <p className="text-gray-500">
          No completed orders found for this period.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSales.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg">{order.orderId}</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">
                  completed
                </span>
              </div>

              <p className="text-xs text-gray-500 mb-2">
                {new Date(order.createdAt).toLocaleString()} ·{" "}
                {order.paymentMethod}
              </p>

              <ul className="text-sm border-t border-b py-2 mb-2 space-y-1">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {item.qty}× {item.name}
                    </span>
                    <span>₱{(item.price * item.qty).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>₱{order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sales;