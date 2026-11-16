import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

// What gets stored inside a product's QR code. StockScanner reads the same "YB:<id>" format.
const productQRValue = (productId) => `YB:${productId}`;

// Shows a product's QR code so it can be printed and stuck on a shelf or box.
const ProductQR = ({ product, onClose }) => {
    const qrRef = useRef(null);

    const handlePrint = () => {
        const svg = qrRef.current?.innerHTML;
        if (!svg) return;
        const win = window.open("", "_blank", "width=420,height=520");
        if (!win) {
            alert("Allow pop-ups to print the QR code.");
            return;
        }
        const safeName = String(product.name).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
        win.document.write(
            `<html><head><title>${safeName} QR</title></head>` +
            `<body style="font-family:sans-serif;text-align:center;padding:24px">` +
            `${svg}<h2 style="margin:12px 0 0">${safeName}</h2></body></html>`
        );
        win.document.close();
        win.focus();
        win.print();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xs text-center relative">
                <button
                    className="absolute top-4 right-4 font-bold text-lg cursor-pointer"
                    onClick={onClose}
                >
                    X
                </button>
                <h1 className="text-xl font-bold mb-4">{product.emoji} {product.name}</h1>
                <div ref={qrRef} className="flex justify-center">
                    <QRCodeSVG value={productQRValue(product._id)} size={220} marginSize={2} />
                </div>
                <button
                    className="w-full mt-4 rounded-md bg-blue-500 text-white p-2 cursor-pointer hover:bg-blue-600"
                    onClick={handlePrint}
                >
                    Print
                </button>
            </div>
        </div>
    );
};

export default ProductQR;
