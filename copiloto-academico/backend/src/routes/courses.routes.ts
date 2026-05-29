import { Router } from 'express';
import * as coursesController from '../controllers/courses.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

// Dashboard
router.get('/dashboard', coursesController.getDashboard);

// Listagem e detalhe
router.get('/', coursesController.getCourses);
router.get('/:id', coursesController.getCourseById);

// Preparação de conteúdo adaptado (sob demanda, sem IA no sync)
router.post('/:id/prepare', coursesController.prepareCourse);
router.post('/:id/refresh', coursesController.refreshCourseContent);
router.get('/:id/generated-content', coursesController.getCourseGeneratedContent);

export default router;
