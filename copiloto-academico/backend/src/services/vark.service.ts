/**
 * Serviço VARK + Onboarding Completo
 *
 * Implementa o modelo VARK (Visual, Auditory, Reading/Writing, Kinesthetic)
 * adaptado para o contexto de Educação Física e Ciências do Esporte.
 *
 * Também salva o perfil esportivo, objetivo de carreira e preferências de estudo
 * coletados no onboarding de 4 etapas.
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export type VarkDimension = 'V' | 'A' | 'R' | 'K';

export interface VarkAnswer {
  questionId: string;
  answer: VarkDimension;
}

export interface VarkScores {
  visual: number;
  auditory: number;
  reading: number;
  kinesthetic: number;
}

export interface VarkProfile {
  scores: VarkScores;
  primaryStyle: string;
  secondaryStyle: string | null;
  description: string;
  studyTips: string[];
}

export interface SportsProfile {
  practiced: string[];    // esportes que pratica
  liked: string[];        // esportes que gosta (mesmo sem praticar)
  followed: string[];     // modalidades que acompanha
  level: string;          // iniciante | intermediário | avançado | atleta
}

export interface StudyPreference {
  summaryLength: 'short' | 'detailed';
  prefersExamples: boolean;
  prefersRealCases: boolean;
  learningMode: string;   // visual | reading | kinesthetic | auditory
}

export interface OnboardingData {
  varkAnswers: VarkAnswer[];
  sportsProfile: SportsProfile;
  careerGoal: string;
  studyPreference: StudyPreference;
}

// ============================================================
// Cálculo do perfil VARK
// ============================================================

/**
 * Calcula os scores e determina o perfil de aprendizagem
 */
export function calculateVarkProfile(answers: VarkAnswer[]): VarkProfile {
  const scores: VarkScores = {
    visual: 0,
    auditory: 0,
    reading: 0,
    kinesthetic: 0,
  };

  for (const { answer } of answers) {
    switch (answer) {
      case 'V': scores.visual++; break;
      case 'A': scores.auditory++; break;
      case 'R': scores.reading++; break;
      case 'K': scores.kinesthetic++; break;
    }
  }

  // Ordena os estilos por pontuação
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a) as [keyof VarkScores, number][];

  const primaryStyle = sorted[0][0];
  // Segundo estilo: só mostrar se tem pontuação > 0 e diferença < 3 do primeiro
  const secondaryStyle = sorted[1][1] > 0 && (sorted[0][1] - sorted[1][1]) < 3
    ? sorted[1][0]
    : null;

  return {
    scores,
    primaryStyle,
    secondaryStyle,
    description: STYLE_DESCRIPTIONS[primaryStyle],
    studyTips: STUDY_TIPS[primaryStyle],
  };
}

// ============================================================
// Persistência — onboarding completo
// ============================================================

/**
 * Salva todo o resultado do onboarding (VARK + perfil esportivo + carreira + preferências)
 */
export async function saveOnboardingResult(userId: string, data: OnboardingData) {
  const { varkAnswers, sportsProfile, careerGoal, studyPreference } = data;

  const profile = calculateVarkProfile(varkAnswers);

  // Salva o histórico de respostas VARK
  await prisma.varkAssessment.create({
    data: { userId, answers: varkAnswers as object[] },
  });

  // Upsert do perfil de aprendizagem com todos os campos
  const learningProfile = await prisma.learningProfile.upsert({
    where: { userId },
    update: {
      visualScore: profile.scores.visual,
      auditoryScore: profile.scores.auditory,
      readingScore: profile.scores.reading,
      kinestheticScore: profile.scores.kinesthetic,
      primaryStyle: profile.primaryStyle,
      secondaryStyle: profile.secondaryStyle,
      sportsProfile: sportsProfile as object,
      careerGoal,
      studyPreference: studyPreference as object,
    },
    create: {
      userId,
      visualScore: profile.scores.visual,
      auditoryScore: profile.scores.auditory,
      readingScore: profile.scores.reading,
      kinestheticScore: profile.scores.kinesthetic,
      primaryStyle: profile.primaryStyle,
      secondaryStyle: profile.secondaryStyle,
      sportsProfile: sportsProfile as object,
      careerGoal,
      studyPreference: studyPreference as object,
    },
  });

  // Marca o onboarding como concluído
  await prisma.user.update({
    where: { id: userId },
    data: { varkCompleted: true },
  });

  logger.info('Onboarding completo salvo', {
    userId,
    primaryStyle: profile.primaryStyle,
    careerGoal,
    sportsLevel: sportsProfile.level,
  });

  return { profile, learningProfile };
}

/**
 * Salva apenas o VARK (compatibilidade com fluxo antigo)
 */
export async function saveVarkResult(userId: string, answers: VarkAnswer[]) {
  const profile = calculateVarkProfile(answers);

  await prisma.varkAssessment.create({
    data: { userId, answers: answers as object[] },
  });

  const learningProfile = await prisma.learningProfile.upsert({
    where: { userId },
    update: {
      visualScore: profile.scores.visual,
      auditoryScore: profile.scores.auditory,
      readingScore: profile.scores.reading,
      kinestheticScore: profile.scores.kinesthetic,
      primaryStyle: profile.primaryStyle,
      secondaryStyle: profile.secondaryStyle,
    },
    create: {
      userId,
      visualScore: profile.scores.visual,
      auditoryScore: profile.scores.auditory,
      readingScore: profile.scores.reading,
      kinestheticScore: profile.scores.kinesthetic,
      primaryStyle: profile.primaryStyle,
      secondaryStyle: profile.secondaryStyle,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { varkCompleted: true },
  });

  logger.info('Perfil VARK salvo', { userId, primaryStyle: profile.primaryStyle });

  return { profile, learningProfile };
}

/**
 * Busca o perfil de aprendizagem de um usuário
 */
export async function getLearningProfile(userId: string) {
  return prisma.learningProfile.findUnique({ where: { userId } });
}

// ============================================================
// Textos descritivos por estilo
// ============================================================

const STYLE_DESCRIPTIONS: Record<string, string> = {
  visual: 'Você aprende melhor com diagramas, gráficos, esquemas e representações visuais. Seu cérebro processa melhor quando a informação está organizada espacialmente e com hierarquia visual clara.',
  auditory: 'Você aprende melhor ouvindo, debatendo e explicando em voz alta. Discussões, músicas, ritmos e narrativas verbais são seus melhores aliados no aprendizado.',
  reading: 'Você aprende melhor lendo e escrevendo. Textos bem estruturados, anotações, listas e a escrita como ferramenta de fixação são ideais para você.',
  kinesthetic: 'Você aprende melhor fazendo, praticando e experimentando. Atividades hands-on, exemplos práticos e a conexão com a experiência física são fundamentais para você.',
};

const STUDY_TIPS: Record<string, string[]> = {
  visual: [
    'Crie mapas mentais e esquemas antes de ler o texto completo',
    'Use cores diferentes para categorizar conceitos biomecânicos',
    'Assista vídeos de biomecânica e analise os movimentos visualmente',
    'Desenhe as estruturas anatômicas enquanto estuda',
    'Use setas e diagramas para representar forças e vetores',
  ],
  auditory: [
    'Leia o conteúdo em voz alta ou grave sua própria explicação',
    'Forme grupos de estudo e explique os conceitos para colegas',
    'Crie mnemônicos e rimas para lembrar nomenclaturas anatômicas',
    'Ouça podcasts de fisiologia e biomecânica esportiva',
    'Debata casos clínicos e situações esportivas em voz alta',
  ],
  reading: [
    'Faça resumos escritos após cada leitura',
    'Crie glossários pessoais de termos técnicos',
    'Anote exemplos esportivos ao lado de cada conceito teórico',
    'Reescreva os conceitos com suas próprias palavras',
    'Use fichas de estudo com definições precisas',
  ],
  kinesthetic: [
    'Pratique os movimentos enquanto estuda anatomia e biomecânica',
    'Realize as atividades práticas antes de ler a teoria',
    'Conecte cada conceito a uma sensação física que já vivenciou',
    'Estude em ambientes ativos — caminhe enquanto revisa',
    'Simule movimentos esportivos para entender os conceitos',
  ],
};
