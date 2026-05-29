/**
 * Serviço de Autenticação Google OAuth 2.0
 *
 * Responsável por:
 * - Gerar a URL de autorização do Google
 * - Trocar o código de autorização por tokens
 * - Buscar informações do perfil do usuário
 * - Fazer refresh dos tokens quando expirados
 */
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import { logger } from '../utils/logger';

// Cliente OAuth2 singleton
export const oauth2Client = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.callbackUrl
);

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  scope?: string;
}

/**
 * Gera a URL para redirecionar o usuário ao login do Google
 */
export function generateAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',   // Necessário para receber refresh_token
    prompt: 'consent',        // Força a tela de consentimento (garante refresh_token)
    scope: [...config.google.scopes], // spread para converter readonly[] em string[]
  });
}

/**
 * Troca o código de autorização OAuth pelos tokens de acesso
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error('Falha ao obter token de acesso do Google');
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || undefined,
    tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    scope: tokens.scope || undefined,
  };
}

/**
 * Busca informações do perfil do usuário no Google
 */
export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  oauth2Client.setCredentials({ access_token: accessToken });

  const response = await oauth2Client.request<{
    sub: string;
    email: string;
    name: string;
    picture?: string;
  }>({
    url: 'https://www.googleapis.com/oauth2/v3/userinfo',
  });

  const user = response.data;

  return {
    googleId: user.sub,
    email: user.email,
    name: user.name,
    avatar: user.picture,
  };
}

/**
 * Cria um cliente OAuth2 com os tokens do usuário
 * Faz refresh automático se o access token estiver expirado
 */
export function createOAuth2ClientForUser(
  accessToken: string,
  refreshToken?: string
): OAuth2Client {
  const client = new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret,
    config.google.callbackUrl
  );

  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return client;
}

/**
 * Faz o refresh do access token usando o refresh token
 * Retorna os novos tokens
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const client = new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret
  );

  client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('Falha ao renovar token de acesso');
  }

  logger.debug('Token de acesso renovado com sucesso');

  return {
    accessToken: credentials.access_token,
    refreshToken: credentials.refresh_token || refreshToken,
    tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
  };
}

/**
 * Verifica se o access token está expirado ou prestes a expirar
 */
export function isTokenExpired(tokenExpiry?: Date | null): boolean {
  if (!tokenExpiry) return false;
  // Considera expirado se faltar menos de 5 minutos
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return tokenExpiry < fiveMinutesFromNow;
}
