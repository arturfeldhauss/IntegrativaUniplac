/**
 * Middleware centralizado de tratamento de erros
 * Captura todos os erros da aplicação e retorna respostas padronizadas
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Classe de erro customizada com status HTTP
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Middleware de erro global do Express
 * Deve ser o ÚLTIMO middleware registrado
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log do erro
  logger.error('Erro na requisição', {
    message: err.message,
    stack: config.isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Erro da aplicação (esperado)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Erro do Prisma — violação de unique constraint
  if (err.message.includes('Unique constraint')) {
    res.status(409).json({
      success: false,
      message: 'Registro duplicado encontrado.',
    });
    return;
  }

  // Erro genérico — não expõe detalhes internos em produção
  res.status(500).json({
    success: false,
    message: config.isDevelopment
      ? err.message
      : 'Erro interno do servidor. Tente novamente mais tarde.',
    ...(config.isDevelopment && { stack: err.stack }),
  });
}

/**
 * Handler para rotas não encontradas (404)
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Rota não encontrada: ${req.method} ${req.path}`,
  });
}
