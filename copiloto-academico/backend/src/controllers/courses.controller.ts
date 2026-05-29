/**
 * Controller de Disciplinas
 */
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import * as preparationService from '../services/preparation.service';

const prisma = new PrismaClient();

/**
 * GET /api/courses
 * Lista todas as disciplinas com contagens e status de preparação.
 */
export async function getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const courses = await prisma.course.findMany({
      where: { userId: req.user!.userId },
      include: {
        _count: {
          select: { materials: true, assignments: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/courses/dashboard
 */
export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;

    const [courses, upcomingAssignments, recentMaterials, user] = await Promise.all([
      prisma.course.findMany({
        where: { userId },
        include: {
          _count: { select: { materials: true, assignments: true } },
        },
        orderBy: { name: 'asc' },
      }),

      prisma.assignment.findMany({
        where: {
          course: { userId },
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: { course: { select: { name: true, id: true } } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),

      prisma.material.findMany({
        where: { course: { userId }, type: 'material' },
        include: { course: { select: { name: true, id: true } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),

      prisma.user.findUnique({
        where: { id: userId },
        include: { learningProfile: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        courses,
        upcomingAssignments,
        recentMaterials,
        learningProfile: user?.learningProfile || null,
        stats: {
          totalCourses: courses.length,
          totalMaterials: courses.reduce((s, c) => s + c._count.materials, 0),
          totalAssignments: courses.reduce((s, c) => s + c._count.assignments, 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/courses/:id
 * Detalhes de uma disciplina (inclui preparationStatus).
 */
export async function getCourseById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const course = await prisma.course.findFirst({
      where: { id, userId: req.user!.userId },
      include: {
        materials: { orderBy: { createdAt: 'desc' } },
        assignments: { orderBy: { dueDate: 'asc' } },
        _count: { select: { materials: true, assignments: true } },
      },
    });

    if (!course) throw new AppError('Disciplina não encontrada', 404);

    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/courses/:id/prepare
 * Inicia (ou retoma) a preparação de conteúdo adaptado para a disciplina.
 * Retorna imediatamente — o processamento ocorre em background.
 */
export async function prepareCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const course = await prisma.course.findFirst({ where: { id, userId } });
    if (!course) throw new AppError('Disciplina não encontrada', 404);

    if (course.preparationStatus === 'PROCESSING') {
      res.json({ success: true, data: { status: 'PROCESSING', message: 'Preparação já em andamento' } });
      return;
    }

    if (course.preparationStatus === 'READY') {
      res.json({ success: true, data: { status: 'READY', message: 'Conteúdo já preparado' } });
      return;
    }

    await preparationService.prepareCourse(userId, id);

    res.status(202).json({
      success: true,
      data: { status: 'PROCESSING', message: 'Preparação iniciada. Acompanhe o status pelo campo preparationStatus.' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/courses/:id/refresh
 * Invalida o conteúdo gerado e reinicia a preparação da disciplina.
 * Usar apenas quando o aluno clica em "Atualizar material personalizado".
 */
export async function refreshCourseContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const course = await prisma.course.findFirst({ where: { id, userId } });
    if (!course) throw new AppError('Disciplina não encontrada', 404);

    // Remove todo conteúdo gerado desta disciplina para este usuário
    await prisma.generatedContent.deleteMany({
      where: { userId, courseId: id },
    });

    // Reseta o status
    await prisma.course.update({
      where: { id },
      data: { preparationStatus: 'PENDING', preparedAt: null, preparationError: null },
    });

    // Inicia nova preparação em background
    await preparationService.prepareCourse(userId, id);

    res.status(202).json({
      success: true,
      data: { status: 'PROCESSING', message: 'Regeneração iniciada.' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/courses/:id/generated-content
 * Retorna o status do conteúdo gerado por material da disciplina.
 */
export async function getCourseGeneratedContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const course = await prisma.course.findFirst({
      where: { id, userId },
      include: {
        materials: {
          where: { type: 'material' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!course) throw new AppError('Disciplina não encontrada', 404);

    const materialStatus = await Promise.all(
      course.materials.map(async (m) => {
        const counts = await prisma.generatedContent.groupBy({
          by: ['type'],
          where: { materialId: m.id, userId },
          _count: true,
        });
        const availableTypes = counts.map((c) => c.type);
        return {
          materialId: m.id,
          materialTitle: m.title,
          availableTypes,
          isProcessed: availableTypes.length > 0,
        };
      })
    );

    res.json({
      success: true,
      data: {
        courseId: id,
        courseName: course.name,
        preparationStatus: course.preparationStatus,
        preparedAt: course.preparedAt,
        preparationError: course.preparationError,
        materials: materialStatus,
        processedCount: materialStatus.filter((m) => m.isProcessed).length,
        totalCount: materialStatus.length,
      },
    });
  } catch (error) {
    next(error);
  }
}
