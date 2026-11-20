import axios from "axios";
import React, { useRef, useState } from "react";
import { API_URL } from "../config";
import QRScanner from "./QRScanner";

// Accepts "YB:<id>" (what ProductQR prints) or a bare 24-character product ID
const parseProductId = (text) => {
    const match = String(text).trim().match(/^(?:YB:)?([0-9a-fA-F]{24})$/);
    return match ? match[1].toLowerCase() : null;
};

// Scan a product's QR code, then add stock (in) or remove stock (out).
// inventory: the product list already loaded by the Inventory page
// onUpdated: called after every successful change so the page can reload its list
const StockScanner = ({ inventory, onUpdated, onClose }) => {
    const [mode, setMode] = useState("in"); // "in" adds stock, "out" removes it
    const [qty, setQty] = useState(1);
    const [scannedId, setScannedId] = useState(null);
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [log, setLog] = useState([]);

    // Ignore further scans while a product is open or a message is still showing
    const lockRef = useRef(false);

    const product = scannedId ? inventory.find((p) => p._id === scannedId) : null;

    const handleScan = (text) => {
        if (lockRef.current) return;
        lockRef.current = true;

        const id = parseProductId(text);
        const found = id ? inventory.find((p) => p._id === id) : null;

        if (!id) {
            setMessage("That QR code isn't a YusheBites product.");
            setTimeout(() => { lockRef.current = false; }, 1500);
            return;
        }
        if (!found) {
            setMessage("Product not found. It may have been deleted.");
            setTimeout(() => { lockRef.current = false; }, 1500);
            return;
        }

        setMessage("");
        setQty(1);
        setScannedId(id); // lock stays on until the change is saved or cancelled
    };

    const reset = () => {
        setScannedId(null);
        setQty(1);
        lockRef.current = false;
    };

    const handleConfirm = async () => {
        if (!product || busy) return;
        const amount = Number(qty);
        if (!Number.isInteger(amount) || amount < 1) {
            setMessage("Enter a whole number of 1 or more.");
            return;
        }

        setBusy(true);
        setMessage("");
        try {
            const response = await axios.patch(
                `${API_URL}/api/inventory/${product._id}/stock`,
                { delta: mode === "in" ? amount : -amount },
                { headers: { Authorization: `Bearer ${localStorage.getItem("pos-token")}` } }
            );
            if (response.data.success) {
                setLog((prev) => [
                    {
                        key: Date.now(),
                        text: `${mode === "in" ? "+" : "-"}${amount} ${product.name} → now ${response.data.inventory.stock}`,
                    },
                    ...prev,
                ]);
                onUpdated();
                reset();
            }
        } catch (error) {
            setMessage(error.response?.data?.message || "Could not update stock. Please try again.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto relative">
                <h1 className="text-xl font-bold">Scan to update stock</h1>
                <button
                    className="absolute top-4 right-4 font-bold text-lg cursor-pointer"
                    onClick={onClose}
                >
                    X
                </button>

                <div className="flex gap-2 mt-4">
                    <button
                        type="button"
                        className={`flex-1 rounded-md p-2 cursor-pointer ${mode === "in" ? "bg-green-500 text-white" : "bg-gray-100"}`}
                        onClick={() => setMode("in")}
                    >
                        Stock in (+)
                    </button>
                    <button
                        type="button"
                        className={`flex-1 rounded-md p-2 cursor-pointer ${mode === "out" ? "bg-red-500 text-white" : "bg-gray-100"}`}
                        onClick={() => setMode("out")}
                    >
                        Stock out (-)
                    </button>
                </div>

                <div className="mt-4">
                    {product ? (
                        <div className="border rounded-lg p-4 flex flex-col gap-3">
                            <div>
                                <p className="font-semibold text-lg">{product.emoji} {product.name}</p>
                                <p className="text-sm text-gray-600">Current stock: {product.stock}</p>
                            </div>
                            <label className="flex items-center gap-2">
                                <span>{mode === "in" ? "Add" : "Remove"}</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                    className="border p-1 rounded px-3 w-24"
                                    autoFocus
                                />
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={busy}
                                    className="flex-1 rounded-md bg-green-500 text-white p-2 cursor-pointer hover:bg-green-600 disabled:opacity-60"
                                    onClick={handleConfirm}
                                >
                                    {busy ? "Saving..." : "Confirm"}
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    className="flex-1 rounded-md bg-gray-200 p-2 cursor-pointer hover:bg-gray-300"
                                    onClick={reset}
                                >
                                    Scan another
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <QRScanner onScan={handleScan} />
                            <p className="mt-2 text-sm text-gray-600">Point the camera at a product's QR code.</p>
                        </>
                    )}
                    {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
                </div>

                {log.length > 0 && (
                    <div className="mt-4">
                        <p className="font-semibold text-sm mb-1">This session</p>
                        <ul className="text-sm text-gray-700 flex flex-col gap-1">
                            {log.map((entry) => (
                                <li key={entry.key}>{entry.text}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockScanner;
