/**
 * Serviço de gerenciamento de usuários
 * Tokens OAuth ficam diretamente na tabela User (sem GoogleAccount separada)
 */
import { PrismaClient } from '@prisma/client';
import { GoogleUserInfo, GoogleTokens } from './googleAuth.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Cria ou atualiza o usuário após login com Google
 */
export async function upsertUserFromGoogle(
  userInfo: GoogleUserInfo,
  tokens: GoogleTokens
) {
  logger.debug('Upserting user from Google', { email: userInfo.email });

  const user = await prisma.user.upsert({
    where: { googleId: userInfo.googleId },
    update: {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.avatar,
      accessToken: tokens.accessToken,
      // Só atualiza o refresh token se veio um novo (Google só envia na 1ª autenticação)
      ...(tokens.refreshToken && { refreshToken: tokens.refreshToken }),
      tokenExpiry: tokens.tokenExpiry,
    },
    create: {
      googleId: userInfo.googleId,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.avatar,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: tokens.tokenExpiry,
    },
    include: { learningProfile: true },
  });

  return user;
}

/**
 * Busca usuário pelo ID
 */
export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { learningProfile: true },
  });
}

/**
 * Retorna os tokens Google do usuário
 */
export async function getUserGoogleTokens(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accessToken: true,
      refreshToken: true,
      tokenExpiry: true,
    },
  });

  if (!user || !user.accessToken) {
    throw new Error('Tokens do Google não encontrados para este usuário');
  }

  return user;
}

/**
 * Atualiza os tokens após um refresh
 */
export async function updateGoogleTokens(
  userId: string,
  tokens: Partial<GoogleTokens>
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(tokens.accessToken && { accessToken: tokens.accessToken }),
      ...(tokens.refreshToken && { refreshToken: tokens.refreshToken }),
      ...(tokens.tokenExpiry && { tokenExpiry: tokens.tokenExpiry }),
    },
  });
}

/**
 * Marca o VARK como concluído
 */
export async function markVarkCompleted(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { varkCompleted: true },
  });
}
