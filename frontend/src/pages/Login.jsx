import { API_URL } from "../config";
import React, { useState } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false); // Fixed: boolean instead of string
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password,
            });

            if (response.data.success) {
                await login(response.data.user, response.data.token);
                if (response.data.user.role === "admin") {
                    navigate("/admin-dashboard");
                } else {
                    navigate("/employee-dashboard");
                }
            } else {
                setError(response.data.message || "Login failed");
            }
        } catch (err) {
            console.error("Full Error Object:", err);

            if (!err.response) {
                setError("Network error: Cannot reach the server.");
            } else {
                setError(err.response.data?.message || err.response.data?.error || "Server error occurred");
            }
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center h-screen justify-center bg-gradient-to-b from-green-600 to-gray-100 space-y-6">
            <h1 className="text-4xl text-white">Inventory Management System</h1>
            <div className="border shadow-lg p-6 w-80 bg-white rounded-md">
                <h2 className="text-2xl font-bold mb-4">Login</h2>
                {error && (
                    <div className="bg-red-200 text-red-700 p-2 mb-4 rounded">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border rounded"
                            name="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter Email"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border rounded"
                            name="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Password"
                        />
                    </div>
                    <div className="mb-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                        >
                            {loading ? "Loading..." : "Login"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;