/**
 * Controller de Sincronização
 * Gerencia a sincronização com o Google Classroom
 */
import { Request, Response, NextFunction } from 'express';
import * as syncService from '../services/sync.service';
import * as googleAuthService from '../services/googleAuth.service';
import * as userService from '../services/user.service';
import { logger } from '../utils/logger';

/**
 * Obtém o cliente OAuth, fazendo refresh do token se necessário
 */
async function getAuthClient(userId: string) {
  const tokens = await userService.getUserGoogleTokens(userId);

  if (googleAuthService.isTokenExpired(tokens.tokenExpiry) && tokens.refreshToken) {
    logger.debug('Token expirado, fazendo refresh...', { userId });
    const newTokens = await googleAuthService.refreshAccessToken(tokens.refreshToken);
    await userService.updateGoogleTokens(userId, newTokens);

    return googleAuthService.createOAuth2ClientForUser(
      newTokens.accessToken,
      newTokens.refreshToken || tokens.refreshToken
    );
  }

  return googleAuthService.createOAuth2ClientForUser(
    tokens.accessToken!,
    tokens.refreshToken || undefined
  );
}

/**
 * POST /api/sync
 * Sincroniza TODOS os cursos do usuário
 */
export async function syncAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    logger.info(`Iniciando sync completo para usuário ${userId}`);

    const auth = await getAuthClient(userId);
    const result = await syncService.syncUserClassroom(userId, auth);

    res.json({
      success: result.status !== 'error',
      message: result.status === 'error'
        ? `Erro na sincronização: ${result.message}`
        : `Sincronização concluída! ${result.coursesCount} disciplinas, ${result.materialsCount} materiais importados.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/sync/course/:courseId
 * Sincroniza um curso específico
 */
export async function syncOneCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.params;

    const auth = await getAuthClient(userId);
    const result = await syncService.syncCourse(userId, courseId, auth);

    res.json({
      success: true,
      message: `Disciplina atualizada! ${result.materialsCount} materiais, ${result.assignmentsCount} atividades.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
