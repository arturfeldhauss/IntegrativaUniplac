/**
 * Serviço de disciplinas
 */
import api from './api';
import type { Course, DashboardData, ApiResponse, CourseGeneratedContentResponse } from '../types';

export const coursesService = {
  async getAll(): Promise<Course[]> {
    const { data } = await api.get<ApiResponse<Course[]>>('/courses');
    return data.data;
  },

  async getById(id: string): Promise<Course> {
    const { data } = await api.get<ApiResponse<Course>>(`/courses/${id}`);
    return data.data;
  },

  async getDashboard(): Promise<DashboardData> {
    const { data } = await api.get<ApiResponse<DashboardData>>('/courses/dashboard');
    return data.data;
  },

  /** Inicia a preparação de conteúdo adaptado (retorna imediatamente, processa em background). */
  async prepare(courseId: string): Promise<{ status: string; message: string }> {
    const { data } = await api.post<ApiResponse<{ status: string; message: string }>>(
      `/courses/${courseId}/prepare`
    );
    return data.data ?? { status: data['status'] as string, message: data['message'] as string };
  },

  /** Invalida o conteúdo gerado e reinicia a preparação. */
  async refreshContent(courseId: string): Promise<{ status: string; message: string }> {
    const { data } = await api.post<ApiResponse<{ status: string; message: string }>>(
      `/courses/${courseId}/refresh`
    );
    return data.data ?? { status: data['status'] as string, message: data['message'] as string };
  },

  /** Retorna status de conteúdo gerado por material da disciplina. */
  async getGeneratedContent(courseId: string): Promise<CourseGeneratedContentResponse> {
    const { data } = await api.get<ApiResponse<CourseGeneratedContentResponse>>(
      `/courses/${courseId}/generated-content`
    );
    return data.data;
  },
};
