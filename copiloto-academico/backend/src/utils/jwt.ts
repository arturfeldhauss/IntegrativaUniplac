/**
 * Utilitários para geração e verificação de JWT
 * O token contém o userId para identificar o usuário nas requisições
 */
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Gera um JWT para o usuário autenticado
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
}

/**
 * Verifica e decodifica um JWT
 * Lança erro se o token for inválido ou expirado
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
}

/**
 * Decodifica um JWT sem verificar a assinatura
 * Útil para ler o payload de tokens expirados (ex: durante refresh)
 */
export function decodeToken(token: string): JWTPayload | null {
  const decoded = jwt.decode(token);
  return decoded as JWTPayload | null;
}
