import http from 'http';
import express from 'express';
import cors from 'cors';
import connectDB from './db/connection.js';
import authRoutes from './routes/auth.js';
import categoryRoutes from './routes/category.js';
import inventoryRoutes from './routes/inventory.js';
import orderRoutes from './routes/order.js';
import { initSocket } from './socket.js';
import { allowedOrigins } from './config.js';
import dashboardRouter from './routes/dashboard.js'

const app = express();
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/dashboard', dashboardRouter);

// Socket.IO needs a plain HTTP server wrapped around Express
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});
