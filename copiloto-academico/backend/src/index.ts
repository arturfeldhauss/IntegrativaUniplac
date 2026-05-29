/**
 * Copiloto Acadêmico — Backend
 * Ponto de entrada principal do servidor Express
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { routes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { config } from './config';

const app = express();

// Railway e Vercel ficam atrás de proxies reversos — necessário para rate-limit e HTTPS
app.set('trust proxy', 1);

// ============================================================
// Middlewares de segurança
// ============================================================

// Headers de segurança HTTP
app.use(helmet());

// CORS — permite requests apenas do frontend configurado
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting — previne abuso de APIs
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200,                   // máx 200 requisições por IP
    message: { success: false, message: 'Muitas requisições. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Rate limiting mais restrito para as rotas de IA (são custosas)
app.use(
  '/api/ai',
  rateLimit({
    windowMs: 60 * 1000,   // 1 minuto
    max: 10,               // máx 10 gerações por minuto
    message: { success: false, message: 'Limite de gerações IA atingido. Aguarde 1 minuto.' },
  })
);

// ============================================================
// Middlewares de parsing
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================================
// Rotas
// ============================================================
app.use('/api', routes);

// Handler para rotas não encontradas
app.use(notFoundHandler);

// Handler global de erros (deve ser o último middleware)
app.use(errorHandler);

// ============================================================
// Inicia o servidor
// ============================================================
app.listen(config.port, () => {
  logger.info(`🚀 Servidor rodando em http://localhost:${config.port}`);
  logger.info(`🌍 Ambiente: ${config.nodeEnv}`);
  logger.info(`🔗 Frontend: ${config.frontendUrl}`);
  logger.info(`🔑 OAuth callback: ${config.google.callbackUrl}`);
  if (config.ai.openai.apiKey) {
    logger.info(`🤖 IA Provider: OpenAI (${config.ai.openai.model})`);
  } else {
    logger.warn(`⚠️  OPENAI_API_KEY não configurada — funcionalidades de IA desabilitadas`);
  }
});

export default app;
