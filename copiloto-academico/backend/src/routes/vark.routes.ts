import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as varkController from '../controllers/vark.controller';

const router = Router();

// Todas as rotas VARK requerem autenticação
router.use(requireAuth);

// POST /api/vark/submit — submete as respostas do questionário
router.post('/submit', varkController.submitVark);

// GET /api/vark/profile — retorna o perfil de aprendizagem do usuário
router.get('/profile', varkController.getProfile);

export default router;
