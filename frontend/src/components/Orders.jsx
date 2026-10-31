import { API_URL } from "../config";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const API = API_URL;
const STATUSES = ["pending", "preparing", "ready", "completed", "cancelled"];

const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    preparing: "bg-blue-100 text-blue-800",
    ready: "bg-green-100 text-green-800",
    completed: "bg-gray-200 text-gray-700",
    cancelled: "bg-red-100 text-red-800",
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("pos-token");
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`${API}/api/order`, authHeader);
                setOrders(response.data.orders || []);
            } catch (error) {
                console.error("Error when fetching orders", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();

        // Live updates: new customer orders appear without refreshing
        const socket = io(API, { auth: { token } });
        socket.on("order:new", (order) => setOrders((prev) => [order, ...prev]));
        socket.on("order:updated", (order) =>
            setOrders((prev) => prev.map((o) => (o._id === order._id ? order : o)))
        );

        return () => socket.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const changeStatus = async (id, status) => {
        try {
            await axios.patch(`${API}/api/order/${id}/status`, { status }, authHeader);
        } catch (error) {
            alert(error.response?.data?.message || "Could not update order");
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Orders</h1>

            {orders.length === 0 && <p className="text-gray-500">No orders yet.</p>}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {orders.map((order) => (
                    <div key={order._id} className="bg-white rounded-xl shadow p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-lg">{order.orderId}</span>
                            <span
                                className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[order.status]}`}
                            >
                                {order.status}
                            </span>
                        </div>

                        <p className="text-xs text-gray-500 mb-2">
                            {new Date(order.createdAt).toLocaleString()} · {order.paymentMethod}
                        </p>

                        <ul className="text-sm border-t border-b py-2 mb-2 space-y-1">
                            {order.items.map((item, i) => (
                                <li key={i} className="flex justify-between">
                                    <span>{item.qty}× {item.name}</span>
                                    <span>₱{(item.price * item.qty).toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex justify-between font-bold mb-3">
                            <span>Total</span>
                            <span>₱{order.total.toFixed(2)}</span>
                        </div>

                        <select
                            value={order.status}
                            onChange={(e) => changeStatus(order._id, e.target.value)}
                            className="w-full border rounded-lg p-2 text-sm"
                        >
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Orders;
