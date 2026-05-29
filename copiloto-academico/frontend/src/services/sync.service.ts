/**
 * Serviço de sincronização — MVP
 */
import api from './api';

export interface SyncResult {
  coursesCount: number;
  materialsCount: number;
  assignmentsCount: number;
  status: 'success' | 'partial' | 'error';
  message?: string;
  duration: number;
}

const SYNC_TIMEOUT = 120_000; // 2 minutos — sync envolve múltiplas chamadas à API do Google em série

export const syncService = {
  async syncAll(): Promise<SyncResult> {
    const { data } = await api.post<{ success: boolean; data: SyncResult }>('/sync', {}, { timeout: SYNC_TIMEOUT });
    return data.data;
  },

  async syncCourse(courseId: string): Promise<SyncResult> {
    const { data } = await api.post<{ success: boolean; data: SyncResult }>(`/sync/course/${courseId}`, {}, { timeout: SYNC_TIMEOUT });
    return data.data;
  },
};
