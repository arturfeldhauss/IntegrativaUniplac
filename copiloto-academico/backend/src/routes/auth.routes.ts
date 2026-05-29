import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Inicia o fluxo OAuth com Google
router.get('/google', authController.initiateGoogleAuth);

// Callback do Google após o usuário autorizar
router.get('/google/callback', authController.handleGoogleCallback);

// Retorna dados do usuário logado (rota protegida)
router.get('/me', requireAuth, authController.getMe);

// Logout (invalidação no cliente)
router.post('/logout', requireAuth, authController.logout);

export default router;
