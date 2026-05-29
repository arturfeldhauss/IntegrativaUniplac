/**
 * Serviço de IA — MVP
 */
import api from './api';
import type { ContentType, GeneratedContent } from '../types';

export const aiService = {
  async generate(params: {
    type: ContentType;
    materialId?: string;
    courseId?: string;
    customContent?: string;
  }): Promise<GeneratedContent> {
    const { data } = await api.post<{ success: boolean; data: GeneratedContent }>('/ai/generate', params);
    return data.data;
  },

  async getHistory(type?: ContentType): Promise<GeneratedContent[]> {
    const { data } = await api.get<{ success: boolean; data: GeneratedContent[] }>('/ai/history', {
      params: type ? { type } : undefined,
    });
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/ai/history/${id}`);
  },
};
