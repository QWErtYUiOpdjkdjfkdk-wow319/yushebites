import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

// Call once from index.js with the HTTP server
export const initSocket = (httpServer) => {
    io = new Server(httpServer, { cors: { origin: "*" } });

    // Only logged-in dashboard users (valid JWT) may listen for orders
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error("No token"));
            jwt.verify(token, process.env.JWT_SECRET);
            next();
        } catch {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log("Dashboard connected:", socket.id);
    });

    return io;
};

export const getIO = () => io;
