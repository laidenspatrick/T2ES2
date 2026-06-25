
import express from 'express';
import { Request, Response } from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { AppDataSource } from './database/database-config.js';
import authRoutes from './app/routes/Routes.js';
import { errorHandling } from './app/middlewares/errorHandler.js';
import { globalLimiter } from './app/middlewares/rateLimiter.js';
import { swaggerSpec, swaggerUiOptions } from './swagger.js';

dotenv.config();
const port = process.env.PORT || 3001;

const app = express();

app.use(cors({
  credentials: true
}));

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(globalLimiter);

const server = http.createServer(app);

// Routes
app.use('/api', authRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.get("/health", async(req: Request, res: Response) => {
  res.send();
});

// Error handling
app.use(errorHandling)

AppDataSource.initialize()
  .then(() => {
    console.log("Database ok.")
    server.listen(port, () => {
      console.log(`Microserviço backend authenticate on http://localhost:${port}/`);
    }); 
  })
  .catch((error) => {
    console.log(error);
    console.error(`Falha ao se conectar no banco de dados`);
  })