import api from './api';
import type { VarkAnswer, VarkResult, LearningProfile, OnboardingPayload } from '../types';

export const varkService = {
  /**
   * Submete o onboarding completo (VARK + esportes + carreira + preferências).
   * Retorna o perfil VARK calculado.
   */
  async submitOnboarding(payload: OnboardingPayload): Promise<VarkResult> {
    const { data } = await api.post<{ success: boolean; data: VarkResult }>('/vark/submit', {
      answers: payload.answers,
      sportsProfile: payload.sportsProfile,
      careerGoal: payload.careerGoal,
      studyPreference: payload.studyPreference,
    });
    return data.data;
  },

  /**
   * Submete apenas o VARK (legado — mantido para compatibilidade).
   */
  async submit(answers: VarkAnswer[]): Promise<VarkResult> {
    const { data } = await api.post<{ success: boolean; data: VarkResult }>('/vark/submit', { answers });
    return data.data;
  },

  /** Busca o perfil de aprendizagem do usuário */
  async getProfile(): Promise<LearningProfile | null> {
    try {
      const { data } = await api.get<{ success: boolean; data: LearningProfile }>('/vark/profile');
      return data.data;
    } catch {
      return null;
    }
  },
};
