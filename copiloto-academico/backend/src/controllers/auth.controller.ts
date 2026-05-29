/**
 * Controller de Autenticação
 * Fluxo OAuth 2.0 com Google + JWT
 */
import { Request, Response, NextFunction } from 'express';
import * as googleAuthService from '../services/googleAuth.service';
import * as userService from '../services/user.service';
import { generateToken } from '../utils/jwt';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * GET /api/auth/google
 * Inicia o fluxo OAuth — redireciona para o Google
 */
export async function initiateGoogleAuth(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUrl = googleAuthService.generateAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/google/callback
 * Callback do Google — troca o código por tokens e cria/atualiza o usuário
 */
export async function handleGoogleCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code, error } = req.query;

    if (error) {
      logger.warn('Usuário negou permissões OAuth', { error });
      res.redirect(`${config.frontendUrl}/login?error=access_denied`);
      return;
    }

    if (!code || typeof code !== 'string') {
      res.redirect(`${config.frontendUrl}/login?error=no_code`);
      return;
    }

    const tokens = await googleAuthService.exchangeCodeForTokens(code);
    const userInfo = await googleAuthService.getUserInfo(tokens.accessToken);
    const user = await userService.upsertUserFromGoogle(userInfo, tokens);

    const jwtToken = generateToken({
      userId: user.id,
      email: user.email,
    });

    logger.info('Login Google bem-sucedido', { userId: user.id });

    // Redireciona com o token — frontend salva no localStorage
    res.redirect(`${config.frontendUrl}/auth/callback?token=${jwtToken}`);
  } catch (error) {
    logger.error('Erro no callback OAuth', { error });

    // Detecta erros específicos para mensagens mais úteis no frontend
    const errorMessage = error instanceof Error ? error.message : String(error);
    let errorCode = 'auth_failed';

    if (errorMessage.includes('redirect_uri_mismatch')) {
      errorCode = 'redirect_uri_mismatch';
    } else if (errorMessage.includes('insufficient_scope') || errorMessage.includes('scope')) {
      errorCode = 'insufficient_scope';
    } else if (errorMessage.includes('invalid_token') || errorMessage.includes('Token')) {
      errorCode = 'invalid_token';
    } else if (errorMessage.includes('API') || errorMessage.includes('not enabled')) {
      errorCode = 'api_not_enabled';
    }

    res.redirect(`${config.frontendUrl}/login?error=${errorCode}`);
  }
}

/**
 * GET /api/auth/me
 * Dados do usuário autenticado, incluindo perfil VARK
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await userService.getUserById(req.user!.userId);

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuário não encontrado' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        varkCompleted: user.varkCompleted,
        learningProfile: user.learningProfile,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, message: 'Logout realizado' });
}
