/**
 * Logger centralizado usando Winston
 * Formata os logs de forma legível no desenvolvimento
 * e em JSON no ambiente de produção
 */
import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, colorize, printf, json } = winston.format;

// Formato legível para desenvolvimento
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// Formato JSON para produção (compatível com ferramentas de log)
const prodFormat = combine(timestamp(), json());

export const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  format: config.isDevelopment ? devFormat : prodFormat,
  transports: [
    new winston.transports.Console(),
    // Em produção, adicionar transporte para arquivo ou serviço externo
  ],
});
