/**
 * Serviço de integração com a Google Classroom API
 *
 * Documentação oficial: https://developers.google.com/classroom/reference/rest
 *
 * Responsável por buscar:
 * - Cursos/disciplinas
 * - Professores
 * - Tópicos
 * - Materiais (courseWorkMaterials)
 * - Atividades (courseWork)
 * - Anúncios (announcements)
 */
import { google, classroom_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger';

// Tipos para os dados retornados do Classroom
export interface ClassroomCourse {
  id: string;
  name: string;
  description?: string;
  section?: string;
  room?: string;
  enrollmentCode?: string;
  courseState: string;
  alternateLink?: string;
  ownerId?: string;
  calendarId?: string;
}

export interface ClassroomTeacher {
  googleId: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ClassroomTopic {
  id: string;
  name: string;
}

export interface ClassroomAttachment {
  type: 'driveFile' | 'youtubeVideo' | 'link' | 'form';
  title: string;
  url?: string;
  driveFileId?: string;
  mimeType?: string;
  thumbnailUrl?: string;
}

export interface ClassroomMaterial {
  id: string;
  title: string;
  description?: string;
  state?: string;
  alternateLink?: string;
  topicId?: string;
  attachments: ClassroomAttachment[];
}

export interface ClassroomAssignment {
  id: string;
  title: string;
  description?: string;
  state?: string;
  alternateLink?: string;
  dueDate?: Date;
  maxPoints?: number;
  workType?: string;
  topicId?: string;
  attachments: ClassroomAttachment[];
}

export interface ClassroomAnnouncement {
  id: string;
  text: string;
  state?: string;
  alternateLink?: string;
  attachments: ClassroomAttachment[];
}

/**
 * Cria uma instância do cliente Classroom para um usuário específico
 */
function createClassroomClient(auth: OAuth2Client): classroom_v1.Classroom {
  return google.classroom({ version: 'v1', auth });
}

/**
 * Converte um attachment do formato da API para o formato interno
 */
function parseAttachment(
  material: classroom_v1.Schema$Material
): ClassroomAttachment | null {
  if (material.driveFile) {
    return {
      type: 'driveFile',
      title: material.driveFile.driveFile?.title || 'Arquivo',
      driveFileId: material.driveFile.driveFile?.id || undefined,
      url: material.driveFile.driveFile?.alternateLink || undefined,
      // mimeType não está disponível na API do Classroom; é obtido separadamente via Drive API
      mimeType: undefined,
      thumbnailUrl: material.driveFile.driveFile?.thumbnailUrl || undefined,
    };
  }

  if (material.youtubeVideo) {
    return {
      type: 'youtubeVideo',
      title: material.youtubeVideo.title || 'Vídeo YouTube',
      url: material.youtubeVideo.alternateLink || undefined,
      thumbnailUrl: material.youtubeVideo.thumbnailUrl || undefined,
    };
  }

  if (material.link) {
    return {
      type: 'link',
      title: material.link.title || material.link.url || 'Link',
      url: material.link.url || undefined,
      thumbnailUrl: material.link.thumbnailUrl || undefined,
    };
  }

  if (material.form) {
    return {
      type: 'form',
      title: material.form.title || 'Formulário',
      url: material.form.formUrl || undefined,
      thumbnailUrl: material.form.thumbnailUrl || undefined,
    };
  }

  return null;
}

/**
 * Busca todos os cursos do usuário no Classroom
 * Inclui cursos onde o usuário é aluno ou professor
 */
export async function fetchCourses(auth: OAuth2Client): Promise<ClassroomCourse[]> {
  const classroom = createClassroomClient(auth);
  const courses: ClassroomCourse[] = [];
  let pageToken: string | undefined;

  do {
    const response = await classroom.courses.list({
      pageSize: 100,
      pageToken,
      courseStates: ['ACTIVE'],
    });

    const items = response.data.courses || [];

    for (const course of items) {
      if (course.id && course.name) {
        courses.push({
          id: course.id,
          name: course.name,
          description: course.description || undefined,
          section: course.section || undefined,
          room: course.room || undefined,
          enrollmentCode: course.enrollmentCode || undefined,
          courseState: course.courseState || 'ACTIVE',
          alternateLink: course.alternateLink || undefined,
          ownerId: course.ownerId || undefined,
          calendarId: course.calendarId || undefined,
        });
      }
    }

    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  logger.debug(`Encontrados ${courses.length} cursos no Classroom`);
  return courses;
}

/**
 * Busca os professores de um curso
 */
export async function fetchTeachers(
  auth: OAuth2Client,
  courseId: string
): Promise<ClassroomTeacher[]> {
  const classroom = createClassroomClient(auth);
  const teachers: ClassroomTeacher[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const response = await classroom.courses.teachers.list({
        courseId,
        pageSize: 30,
        pageToken,
      });

      const items = response.data.teachers || [];

      for (const teacher of items) {
        const profile = teacher.profile;
        if (profile?.id) {
          teachers.push({
            googleId: profile.id,
            name: profile.name?.fullName || 'Professor',
            email: profile.emailAddress || '',
            avatar: profile.photoUrl || undefined,
          });
        }
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);
  } catch (error) {
    // Pode falhar se o usuário não tiver permissão para ver professores
    logger.warn(`Não foi possível buscar professores do curso ${courseId}`, { error });
  }

  return teachers;
}

/**
 * Busca os tópicos de um curso
 */
export async function fetchTopics(
  auth: OAuth2Client,
  courseId: string
): Promise<ClassroomTopic[]> {
  const classroom = createClassroomClient(auth);
  const topics: ClassroomTopic[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const response = await classroom.courses.topics.list({
        courseId,
        pageSize: 100,
        pageToken,
      });

      const items = response.data.topic || [];

      for (const topic of items) {
        if (topic.topicId && topic.name) {
          topics.push({
            id: topic.topicId,
            name: topic.name,
          });
        }
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);
  } catch (error) {
    logger.warn(`Não foi possível buscar tópicos do curso ${courseId}`, { error });
  }

  return topics;
}

/**
 * Busca os materiais de um curso (courseWorkMaterials)
 */
export async function fetchMaterials(
  auth: OAuth2Client,
  courseId: string
): Promise<ClassroomMaterial[]> {
  const classroom = createClassroomClient(auth);
  const materials: ClassroomMaterial[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const response = await classroom.courses.courseWorkMaterials.list({
        courseId,
        pageSize: 100,
        pageToken,
        courseWorkMaterialStates: ['PUBLISHED', 'DRAFT'],
      });

      const items = response.data.courseWorkMaterial || [];

      for (const item of items) {
        if (item.id) {
          // Processa os attachments (materiais anexados)
          const attachments: ClassroomAttachment[] = [];
          for (const material of item.materials || []) {
            const attachment = parseAttachment(material);
            if (attachment) attachments.push(attachment);
          }

          materials.push({
            id: item.id,
            title: item.title || 'Material sem título',
            description: item.description || undefined,
            state: item.state || undefined,
            alternateLink: item.alternateLink || undefined,
            topicId: item.topicId || undefined,
            attachments,
          });
        }
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);
  } catch (error) {
    logger.warn(`Não foi possível buscar materiais do curso ${courseId}`, { error });
  }

  logger.debug(`Encontrados ${materials.length} materiais no curso ${courseId}`);
  return materials;
}

/**
 * Busca as atividades de um curso (courseWork)
 */
export async function fetchAssignments(
  auth: OAuth2Client,
  courseId: string
): Promise<ClassroomAssignment[]> {
  const classroom = createClassroomClient(auth);
  const assignments: ClassroomAssignment[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const response = await classroom.courses.courseWork.list({
        courseId,
        pageSize: 100,
        pageToken,
        courseWorkStates: ['PUBLISHED', 'DRAFT'],
      });

      const items = response.data.courseWork || [];

      for (const item of items) {
        if (item.id) {
          // Processa a data de entrega
          let dueDate: Date | undefined;
          if (item.dueDate && item.dueTime) {
            dueDate = new Date(
              item.dueDate.year || 2024,
              (item.dueDate.month || 1) - 1,
              item.dueDate.day || 1,
              item.dueTime.hours || 23,
              item.dueTime.minutes || 59
            );
          } else if (item.dueDate) {
            dueDate = new Date(
              item.dueDate.year || 2024,
              (item.dueDate.month || 1) - 1,
              item.dueDate.day || 1
            );
          }

          // Processa os attachments
          const attachments: ClassroomAttachment[] = [];
          for (const material of item.materials || []) {
            const attachment = parseAttachment(material);
            if (attachment) attachments.push(attachment);
          }

          assignments.push({
            id: item.id,
            title: item.title || 'Atividade sem título',
            description: item.description || undefined,
            state: item.state || undefined,
            alternateLink: item.alternateLink || undefined,
            dueDate,
            maxPoints: item.maxPoints || undefined,
            workType: item.workType || undefined,
            topicId: item.topicId || undefined,
            attachments,
          });
        }
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);
  } catch (error) {
    logger.warn(`Não foi possível buscar atividades do curso ${courseId}`, { error });
  }

  logger.debug(`Encontradas ${assignments.length} atividades no curso ${courseId}`);
  return assignments;
}

/**
 * Busca os anúncios de um curso
 */
export async function fetchAnnouncements(
  auth: OAuth2Client,
  courseId: string
): Promise<ClassroomAnnouncement[]> {
  const classroom = createClassroomClient(auth);
  const announcements: ClassroomAnnouncement[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const response = await classroom.courses.announcements.list({
        courseId,
        pageSize: 100,
        pageToken,
        announcementStates: ['PUBLISHED', 'DRAFT'],
      });

      const items = response.data.announcements || [];

      for (const item of items) {
        if (item.id) {
          const attachments: ClassroomAttachment[] = [];
          for (const material of item.materials || []) {
            const attachment = parseAttachment(material);
            if (attachment) attachments.push(attachment);
          }

          announcements.push({
            id: item.id,
            text: item.text || '',
            state: item.state || undefined,
            alternateLink: item.alternateLink || undefined,
            attachments,
          });
        }
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);
  } catch (error) {
    logger.warn(`Não foi possível buscar anúncios do curso ${courseId}`, { error });
  }

  return announcements;
}
