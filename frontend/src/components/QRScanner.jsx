import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

// Opens the camera and calls onScan(text) every time a QR code is read.
// The camera needs HTTPS (or localhost) and the user's permission.
const QRScanner = ({ onScan }) => {
    const regionId = "qr-reader-region";
    const onScanRef = useRef(onScan);
    const [error, setError] = useState("");

    // Always call the newest onScan without restarting the camera
    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        const scanner = new Html5Qrcode(regionId);
        let started = false;
        let cancelled = false;

        const stop = () =>
            scanner.stop().then(() => scanner.clear()).catch(() => { });

        scanner
            .start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                (text) => onScanRef.current?.(text),
                () => { } // called for every frame with no QR code, safe to ignore
            )
            .then(() => {
                started = true;
                if (cancelled) stop(); // closed before the camera finished starting
            })
            .catch((err) => {
                console.error("Camera error:", err);
                setError(
                    "Could not open the camera. Allow camera access in your browser, " +
                    "and make sure the site is opened over HTTPS (or localhost)."
                );
            });

        return () => {
            cancelled = true;
            if (started) stop();
        };
    }, []);

    return (
        <div>
            <div id={regionId} className="w-full overflow-hidden rounded-lg bg-black" />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default QRScanner;
