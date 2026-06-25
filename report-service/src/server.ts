import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import { AppDataSource } from './database/database-config.js';
import router from './app/routes/Routes.js';
import { errorHandling } from './app/middlewares/errorHandler.js';
import { globalLimiter } from './app/middlewares/rateLimiter.js';
import { swaggerUiServe, swaggerUiSetup } from './swagger.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3005;

// ── Middlewares globais ───────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// ── Swagger ───────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUiServe, swaggerUiSetup);

// ── Rotas ─────────────────────────────────────────────────────────────────────
app.use('/api/v1', router);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandling);

// ── Inicialização ─────────────────────────────────────────────────────────────
AppDataSource.initialize()
  .then(() => {
    console.log('[DB] Conectado ao PostgreSQL com sucesso.');
    app.listen(PORT, () => {
      console.log(`[Server] Report Service rodando em http://localhost:${PORT}`);
      console.log(`[Swagger] Documentação em http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    console.error('[DB] Falha ao conectar:', err);
    process.exit(1);
  });

export default app;
