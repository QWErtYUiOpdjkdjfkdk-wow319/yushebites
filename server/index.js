import http from 'http';
import express from 'express';
import cors from 'cors';
import connectDB from './db/connection.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/category.js';
import orderRoutes from './routes/order.js';
import { initSocket } from './socket.js';

const app = express();
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/order', orderRoutes);

// Socket.IO needs a plain HTTP server wrapped around Express
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
