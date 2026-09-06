import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import movementRoutes from './routes/movementRoutes.js';
import csvRoutes from './routes/csvRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import alertRoutes from './routes/alertRoutes.js';

const app = express();

// Global Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = config.port || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Inventory Server running on port ${PORT} [${config.nodeEnv}]`);
});

export default app;
