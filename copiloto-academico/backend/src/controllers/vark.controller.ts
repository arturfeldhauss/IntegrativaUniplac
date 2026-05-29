/**
 * Controller VARK + Onboarding — Perfil Completo do Aluno
 *
 * POST /api/vark/submit         → onboarding completo (4 etapas)
 * POST /api/vark/submit-legacy  → apenas VARK (compatibilidade)
 * GET  /api/vark/profile        → retorna perfil de aprendizagem
 */
import { Request, Response, NextFunction } from 'express';
import * as varkService from '../services/vark.service';
import { logger } from '../utils/logger';

/**
 * POST /api/vark/submit
 * Recebe o onboarding completo (VARK + esportes + carreira + preferências)
 * e salva o perfil inteligente do aluno.
 */
export async function submitVark(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { answers, sportsProfile, careerGoal, studyPreference } = req.body as {
      answers: varkService.VarkAnswer[];
      sportsProfile?: varkService.SportsProfile;
      careerGoal?: string;
      studyPreference?: varkService.StudyPreference;
    };

    if (!answers || !Array.isArray(answers) || answers.length < 10) {
      res.status(400).json({ success: false, message: 'Respostas VARK inválidas ou incompletas' });
      return;
    }

    const valid = answers.every(
      (a) => a.questionId && ['V', 'A', 'R', 'K'].includes(a.answer)
    );
    if (!valid) {
      res.status(400).json({ success: false, message: 'Formato de resposta VARK inválido' });
      return;
    }

    let result;

    if (sportsProfile && careerGoal && studyPreference) {
      // Onboarding completo (novo fluxo)
      result = await varkService.saveOnboardingResult(userId, {
        varkAnswers: answers,
        sportsProfile,
        careerGoal,
        studyPreference,
      });
    } else {
      // Apenas VARK (compatibilidade)
      result = await varkService.saveVarkResult(userId, answers);
    }

    const { profile, learningProfile } = result;
    logger.info('Onboarding submetido', { userId, primaryStyle: profile.primaryStyle, careerGoal });

    res.json({
      success: true,
      data: {
        primaryStyle: profile.primaryStyle,
        secondaryStyle: profile.secondaryStyle,
        scores: profile.scores,
        description: profile.description,
        studyTips: profile.studyTips,
        learningProfile,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/vark/profile
 * Retorna o perfil de aprendizagem completo do usuário
 */
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const profile = await varkService.getLearningProfile(userId);

    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Perfil não encontrado. Complete o onboarding.',
      });
      return;
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}
