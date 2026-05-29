/**
 * Middleware de autenticação via JWT
 * Verifica o token em todas as rotas protegidas
 */
import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { logger } from '../utils/logger';

// Extensão do tipo Request para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware que exige autenticação JWT válida
 * O token deve ser enviado no header: Authorization: Bearer <token>
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    // Extrai o token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verifica e decodifica o token
    const payload = verifyToken(token);
    req.user = payload;

    next();
  } catch (error) {
    logger.warn('Token JWT inválido ou expirado', { error });
    res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado. Faça login novamente.',
    });
  }
}

/**
 * Middleware opcional — não bloqueia se não tiver token
 * Útil para rotas públicas que também servem usuários autenticados
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = verifyToken(token);
    } catch {
      // Token inválido — ignora e continua sem usuário
    }
  }

  next();
}
