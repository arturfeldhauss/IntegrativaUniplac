import { Router } from 'express';
import * as syncController from '../controllers/sync.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

// Sincronizar todos os cursos
router.post('/', syncController.syncAll);

// Sincronizar um curso específico
router.post('/course/:courseId', syncController.syncOneCourse);

export default router;
