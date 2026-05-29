/**
 * Roteador principal da API
 */
import { Router } from 'express';
import authRoutes from './auth.routes';
import coursesRoutes from './courses.routes';
import syncRoutes from './sync.routes';
import aiRoutes from './ai.routes';
import varkRoutes from './vark.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.0.0-mvp' });
});

router.use('/auth', authRoutes);
router.use('/courses', coursesRoutes);
router.use('/sync', syncRoutes);
router.use('/ai', aiRoutes);
router.use('/vark', varkRoutes);

export { router as routes };
