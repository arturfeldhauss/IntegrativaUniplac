/**
 * Controller de Conteúdo de Estudo
 *
 * O aluno NUNCA interage com estes endpoints diretamente —
 * eles apenas entregam conteúdo já preparado automaticamente.
 *
 * GET /api/ai/material/:materialId   → conteúdo do material
 * GET /api/ai/course/:courseId       → todo conteúdo de uma disciplina
 * GET /api/ai/history                → histórico (interno)
 * DELETE /api/ai/history/:id         → remove item
 *
 * POST /api/ai/generate (mantido para retrocompat.)
 */
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import * as aiService from '../services/ai.service';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * GET /api/ai/material/:materialId
 * Retorna todo o conteúdo já preparado para um material específico.
 * Usado pelo frontend para mostrar "Resumo disponível", "Flashcards disponíveis", etc.
 */
export async function getContentByMaterial(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { materialId } = req.params;

    const material = await prisma.material.findFirst({
      where: { id: materialId, course: { userId } },
      include: { course: { select: { name: true } } },
    });

    if (!material) throw new AppError('Material não encontrado', 404);

    const content = await prisma.generatedContent.findMany({
      where: { materialId, userId },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupa por tipo para facilitar o frontend
    const grouped: Record<string, typeof content[0] | null> = {
      summary: null,
      flashcards: null,
      quiz: null,
      study_guide: null,
    };

    for (const item of content) {
      if (!grouped[item.type]) {
        grouped[item.type] = item;
      }
    }

    res.json({
      success: true,
      data: {
        material: { id: material.id, title: material.title, course: material.course },
        content: grouped,
        hasContent: content.length > 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ai/course/:courseId
 * Retorna o status de conteúdo de todos os materiais de uma disciplina.
 * O frontend usa isso para mostrar badges "Disponível" por material.
 */
export async function getContentByCourse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.params;

    const course = await prisma.course.findFirst({
      where: { id: courseId, userId },
      include: {
        materials: {
          where: { type: 'material' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!course) throw new AppError('Disciplina não encontrada', 404);

    // Para cada material, verifica quais tipos de conteúdo estão disponíveis
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
        courseId,
        courseName: course.name,
        materials: materialStatus,
        processedCount: materialStatus.filter((m) => m.isProcessed).length,
        totalCount: materialStatus.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ai/history
 * Histórico de conteúdo (interno, usado para debug/admin)
 */
export async function getHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { type } = req.query;

    const history = await prisma.generatedContent.findMany({
      where: {
        userId,
        ...(type && { type: type as string }),
      },
      include: {
        material: { select: { title: true, id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ai/history/:id
 */
export async function getGeneratedContent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const item = await prisma.generatedContent.findFirst({
      where: { id, userId },
      include: { material: { select: { title: true, courseId: true } } },
    });

    if (!item) throw new AppError('Conteúdo não encontrado', 404);

    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/ai/history/:id
 */
export async function deleteGeneratedContent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const item = await prisma.generatedContent.findFirst({ where: { id, userId } });
    if (!item) throw new AppError('Conteúdo não encontrado', 404);

    await prisma.generatedContent.delete({ where: { id } });

    res.json({ success: true, message: 'Conteúdo removido' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/ai/generate
 * Mantido para retrocompatibilidade e uso interno.
 * Na nova filosofia, a geração é sempre automática (via sync).
 */
export async function generateContent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { materialId, courseId, type, customContent } = req.body as {
      materialId?: string;
      courseId?: string;
      type: aiService.ContentType;
      customContent?: string;
    };

    if (!type || !['summary', 'flashcards', 'quiz', 'study_guide'].includes(type)) {
      throw new AppError('Tipo inválido', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { learningProfile: true },
    });

    const profile = user?.learningProfile;
    const sportsData = profile?.sportsProfile as { practiced?: string[] } | null;

    const studentProfile: aiService.StudentProfile = {
      varkStyle: (profile?.primaryStyle || 'kinesthetic') as aiService.VarkStyle,
      secondaryStyle: profile?.secondaryStyle,
      sports: sportsData?.practiced,
      careerGoal: profile?.careerGoal,
    };

    let content = '';
    let courseName = 'Educação Física e Ciências do Esporte';
    let materialTitle = 'Material';
    let sourceTitle = '';

    if (materialId) {
      const material = await prisma.material.findFirst({
        where: { id: materialId, course: { userId } },
        include: { course: { select: { name: true } } },
      });
      if (!material) throw new AppError('Material não encontrado', 404);

      courseName = material.course.name;
      materialTitle = material.title;
      sourceTitle = material.title;

      const attachments = (material.attachments as Array<{ title?: string }> | null) || [];
      const attachmentTitles = attachments.map((a) => a.title).filter(Boolean) as string[];

      content = aiService.prepareMaterialText(
        material.title,
        material.description,
        material.extractedText,
        attachmentTitles
      );
    } else if (courseId) {
      const course = await prisma.course.findFirst({
        where: { id: courseId, userId },
        include: { materials: { orderBy: { createdAt: 'desc' }, take: 8 } },
      });
      if (!course) throw new AppError('Disciplina não encontrada', 404);

      courseName = course.name;
      sourceTitle = course.name;
      materialTitle = `Resumo da disciplina ${course.name}`;
      const mats = course.materials
        .map((m) => `- ${m.title}: ${m.description || 'sem descrição'}`)
        .join('\n');
      content = `Disciplina: ${course.name}\n\nMateriais:\n${mats}`;
    } else if (customContent) {
      content = customContent.slice(0, 6000);
      sourceTitle = 'Conteúdo personalizado';
    } else {
      throw new AppError('Forneça materialId, courseId ou customContent', 400);
    }

    if (!content.trim()) throw new AppError('Conteúdo insuficiente', 400);

    logger.info(`Processando ${type} para usuário ${userId}`, { varkStyle: studentProfile.varkStyle });

    const aiResult = await aiService.generateContent({
      type,
      profile: studentProfile,
      courseName,
      materialTitle,
      content,
    });

    const saved = await prisma.generatedContent.create({
      data: {
        userId,
        materialId: materialId || undefined,
        type,
        content: aiResult.content,
        varkStyle: studentProfile.varkStyle,
        sourceTitle,
        autoGenerated: false,
      },
    });

    res.json({
      success: true,
      data: {
        id: saved.id,
        type: saved.type,
        content: saved.content,
        varkStyle: saved.varkStyle,
        model: aiResult.model,
        createdAt: saved.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}
