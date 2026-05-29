/**
 * Serviço de Sincronização com o Google Classroom
 *
 * Responsabilidade única: importar e salvar dados brutos do Classroom.
 * NÃO chama OpenAI. NÃO gera conteúdo adaptado.
 * A preparação de conteúdo acontece sob demanda via preparation.service.ts.
 */
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import * as classroomService from './classroom.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface SyncResult {
  coursesCount: number;
  materialsCount: number;
  assignmentsCount: number;
  status: 'success' | 'partial' | 'error';
  message?: string;
  duration: number;
}

/**
 * Sincroniza todos os cursos ativos do Google Classroom para um usuário.
 * Apenas importa metadados — nenhuma chamada à OpenAI.
 */
export async function syncUserClassroom(
  userId: string,
  auth: OAuth2Client
): Promise<SyncResult> {
  const startTime = Date.now();
  let coursesCount = 0;
  let materialsCount = 0;
  let assignmentsCount = 0;

  logger.info(`Iniciando sincronização para usuário ${userId}`);

  try {
    const courses = await classroomService.fetchCourses(auth);
    coursesCount = courses.length;

    for (const courseData of courses) {
      const course = await prisma.course.upsert({
        where: {
          googleId_userId: { googleId: courseData.id, userId },
        },
        update: {
          name: courseData.name,
          description: courseData.description,
          section: courseData.section,
          enrollmentCode: courseData.enrollmentCode,
          courseState: courseData.courseState,
          alternateLink: courseData.alternateLink,
        },
        create: {
          googleId: courseData.id,
          userId,
          name: courseData.name,
          description: courseData.description,
          section: courseData.section,
          enrollmentCode: courseData.enrollmentCode,
          courseState: courseData.courseState,
          alternateLink: courseData.alternateLink,
          preparationStatus: 'PENDING',
        },
      });

      const { count: mCount, hasNew } = await syncMaterials(course.id, courseData.id, auth);
      materialsCount += mCount;

      const anCount = await syncAnnouncements(course.id, courseData.id, auth);
      materialsCount += anCount;

      // Se chegaram novos materiais e o conteúdo já estava pronto, volta para PENDING
      if (hasNew && course.preparationStatus === 'READY') {
        await prisma.course.update({
          where: { id: course.id },
          data: { preparationStatus: 'PENDING', preparedAt: null },
        });
      }
    }

    const duration = Date.now() - startTime;
    logger.info('Sincronização concluída', { userId, coursesCount, materialsCount, duration });

    return { coursesCount, materialsCount, assignmentsCount, status: 'success', duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error('Erro na sincronização', { error, userId });

    return {
      coursesCount,
      materialsCount,
      assignmentsCount,
      status: 'error',
      message: errorMessage,
      duration,
    };
  }
}

/**
 * Sincroniza apenas um curso específico (sem IA).
 */
export async function syncCourse(
  userId: string,
  courseId: string,
  auth: OAuth2Client
): Promise<SyncResult> {
  const startTime = Date.now();

  const course = await prisma.course.findFirst({ where: { id: courseId, userId } });
  if (!course) throw new Error('Disciplina não encontrada');

  const { count: mCount, hasNew } = await syncMaterials(course.id, course.googleId, auth);
  const anCount = await syncAnnouncements(course.id, course.googleId, auth);

  if (hasNew && course.preparationStatus === 'READY') {
    await prisma.course.update({
      where: { id: course.id },
      data: { preparationStatus: 'PENDING', preparedAt: null },
    });
  }

  return {
    coursesCount: 1,
    materialsCount: mCount + anCount,
    assignmentsCount: 0,
    status: 'success',
    duration: Date.now() - startTime,
  };
}

// ============================================================
// Helpers privados
// ============================================================

interface SyncMaterialsResult {
  count: number;
  hasNew: boolean;
}

async function syncMaterials(courseId: string, googleCourseId: string, auth: OAuth2Client): Promise<SyncMaterialsResult> {
  const materials = await classroomService.fetchMaterials(auth, googleCourseId);
  let hasNew = false;

  for (const material of materials) {
    const existing = await prisma.material.findUnique({
      where: { googleId_courseId: { googleId: material.id, courseId } },
    });

    await prisma.material.upsert({
      where: { googleId_courseId: { googleId: material.id, courseId } },
      update: {
        title: material.title,
        description: material.description,
        state: material.state,
        alternateLink: material.alternateLink,
        attachments: material.attachments.length > 0 ? material.attachments as object[] : undefined,
      },
      create: {
        googleId: material.id,
        courseId,
        type: 'material',
        title: material.title,
        description: material.description,
        state: material.state,
        alternateLink: material.alternateLink,
        attachments: material.attachments.length > 0 ? material.attachments as object[] : undefined,
      },
    });

    if (!existing) hasNew = true;
  }

  return { count: materials.length, hasNew };
}

async function syncAnnouncements(courseId: string, googleCourseId: string, auth: OAuth2Client): Promise<number> {
  const announcements = await classroomService.fetchAnnouncements(auth, googleCourseId);

  for (const announcement of announcements) {
    await prisma.material.upsert({
      where: { googleId_courseId: { googleId: announcement.id, courseId } },
      update: {
        title: announcement.text.slice(0, 100),
        description: announcement.text,
        state: announcement.state,
        alternateLink: announcement.alternateLink,
        attachments: announcement.attachments.length > 0 ? announcement.attachments as object[] : undefined,
      },
      create: {
        googleId: announcement.id,
        courseId,
        type: 'announcement',
        title: announcement.text.slice(0, 100) || 'Anúncio',
        description: announcement.text,
        state: announcement.state,
        alternateLink: announcement.alternateLink,
        attachments: announcement.attachments.length > 0 ? announcement.attachments as object[] : undefined,
      },
    });
  }

  return announcements.length;
}
