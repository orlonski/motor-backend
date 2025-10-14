import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import endpointRoutes from './routes/endpointRoutes.js';
import mappingRoutes from './routes/mappingRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/endpoints', endpointRoutes);
app.use('/api/integrations', endpointRoutes); // Para rota /api/integrations/:integrationId/endpoints
app.use('/api/mappings', mappingRoutes);
app.use('/api/endpoints', mappingRoutes); // Para rota /api/endpoints/:endpointId/mappings

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

export default app;
