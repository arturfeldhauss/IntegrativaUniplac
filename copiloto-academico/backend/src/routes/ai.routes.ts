import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

// ============================================================
// Conteúdo por material / disciplina (novos endpoints)
// O frontend usa esses para mostrar "Disponível" automaticamente
// ============================================================

// Conteúdo de um material específico (resumo, flashcards, etc.)
router.get('/material/:materialId', aiController.getContentByMaterial);

// Status de conteúdo de todos os materiais de uma disciplina
router.get('/course/:courseId', aiController.getContentByCourse);

// ============================================================
// Histórico interno
// ============================================================
router.get('/history', aiController.getHistory);
router.get('/history/:id', aiController.getGeneratedContent);
router.delete('/history/:id', aiController.deleteGeneratedContent);

// ============================================================
// Geração (retrocompatibilidade + uso interno)
// ============================================================
router.post('/generate', aiController.generateContent);

export default router;
