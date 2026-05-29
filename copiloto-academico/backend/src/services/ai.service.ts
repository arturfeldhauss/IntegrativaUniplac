/**
 * Serviço de IA — Motor de Processamento Automático
 *
 * Toda a inteligência do produto vive aqui, invisível ao aluno.
 * O aluno nunca interage com este serviço diretamente.
 *
 * Pipeline automático:
 * 1. Após sync → materiais novos entram na fila
 * 2. Este serviço processa cada material com o perfil completo do aluno
 * 3. Gera: resumo adaptado, flashcards, quiz, guia de estudo
 * 4. Tudo fica disponível automaticamente no dashboard
 */
import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';

export type ContentType = 'summary' | 'flashcards' | 'quiz' | 'study_guide';

export type VarkStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic';

export interface StudentProfile {
  varkStyle: VarkStyle;
  secondaryStyle?: string | null;
  sports?: string[];          // esportes que pratica/gosta
  careerGoal?: string | null; // objetivo profissional
  prefersExamples?: boolean;
  prefersRealCases?: boolean;
  summaryLength?: 'short' | 'detailed';
}

export interface AIRequest {
  type: ContentType;
  profile: StudentProfile;
  courseName: string;
  materialTitle: string;
  content: string;
}

export interface AIResult {
  content: string;
  model: string;
}

// Lazy init do cliente OpenAI
let openaiClient: OpenAI | null = null;
function getClient(): OpenAI {
  if (!openaiClient) {
    if (!config.ai.openai.apiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }
    openaiClient = new OpenAI({ apiKey: config.ai.openai.apiKey });
  }
  return openaiClient;
}

// ============================================================
// INSTRUÇÕES DO PERFIL VARK
// ============================================================
const VARK_INSTRUCTIONS: Record<VarkStyle, string> = {
  visual: `O aluno aprende melhor com recursos VISUAIS. Use:
- Esquemas descritos em texto ("Imagine um diagrama com...")
- Comparações visuais e analogias espaciais
- Títulos em negrito, listas organizadas, hierarquia visual
- Expressões como "Visualize que...", "Imagine uma linha do tempo..."`,

  auditory: `O aluno aprende melhor de forma AUDITIVA. Use:
- Linguagem conversacional e narrativa
- Ritmo, analogias verbais, como uma história contada
- Expressões como "A lógica soa assim...", "Pense nisso como..."
- Sugira que leia em voz alta`,

  reading: `O aluno aprende melhor por LEITURA/ESCRITA. Use:
- Texto bem estruturado com hierarquia clara
- Definições precisas, terminologia técnica
- Títulos, subtítulos, bullet points numerados
- Listas detalhadas e anotações`,

  kinesthetic: `O aluno aprende melhor de forma CINESTÉSICA. Use:
- Aplicações práticas e exemplos do mundo real
- Sensações físicas, movimentos corporais
- Expressões como "Sinta quando você...", "Execute o movimento de..."
- Exercícios práticos para cada conceito`,
};

// ============================================================
// CONTEXTO ESPORTIVO PERSONALIZADO
// ============================================================
function buildSportsContext(profile: StudentProfile): string {
  const sports = profile.sports?.length ? profile.sports.join(', ') : 'esportes em geral';
  const career = profile.careerGoal || 'ciências do esporte';
  const style = profile.prefersExamples ? 'exemplos práticos e casos reais' : 'conceitos aplicados';

  return `CONTEXTO DO ALUNO:
- Modalidades de referência: ${sports}
- Objetivo profissional: ${career}
- Prefere: ${style}

REGRA FUNDAMENTAL: Conecte SEMPRE a teoria com exemplos de ${sports}.
Cada conceito deve aparecer numa situação real de treino, jogo ou performance relacionada ao ${career}.`;
}

// ============================================================
// PROMPT MESTRE
// ============================================================
function buildSystemPrompt(profile: StudentProfile): string {
  return `Você é o sistema de aprendizagem adaptativa — um tutor especializado em Educação Física, biomecânica, anatomia funcional, fisiologia do exercício e ciências do esporte.

PERFIL DE APRENDIZAGEM:
${VARK_INSTRUCTIONS[profile.varkStyle]}

${buildSportsContext(profile)}

Responda sempre em português brasileiro claro e didático.`;
}

// ============================================================
// PROMPTS POR TIPO
// ============================================================
function buildUserPrompt(req: AIRequest): string {
  const { type, courseName, materialTitle, content, profile } = req;
  const detailLevel = profile.summaryLength === 'short' ? 'resumido e direto' : 'detalhado e completo';
  const sports = profile.sports?.slice(0, 3).join(', ') || 'esporte';

  const context = `DISCIPLINA: ${courseName}
MATERIAL: "${materialTitle}"

CONTEÚDO:
${content.slice(0, 6000)}`;

  const prompts: Record<ContentType, string> = {
    summary: `${context}

TAREFA: Crie um resumo ${detailLevel} adaptado ao perfil do aluno.

Estrutura obrigatória:
1. **Conceito Central** (1-2 frases)
2. **Pontos Chave** (5-7 conceitos mais importantes)
3. **Aplicação em ${sports}** (como esse conteúdo aparece no esporte)
4. **Exemplo Prático** (situação real de treino ou competição)
5. **Para Fixar** (3 perguntas com resposta)

Use formatação Markdown.`,

    flashcards: `${context}

TAREFA: Crie 10-15 flashcards de revisão prontos para estudo.

REGRAS:
- Frente: pergunta ou conceito
- Verso: resposta clara e completa
- Pelo menos 5 cards com contexto direto de ${sports}

Retorne APENAS JSON válido:
[
  {
    "front": "Pergunta ou conceito",
    "back": "Resposta completa",
    "sport_example": "Exemplo em ${sports}"
  }
]`,

    quiz: `${context}

TAREFA: Crie 5-8 questões de múltipla escolha para autoavaliação.

REGRAS:
- Pelo menos 3 questões com cenário de ${sports}
- 4 alternativas por questão
- Explicações práticas

Retorne APENAS JSON válido:
[
  {
    "question": "Enunciado (pode ter contexto esportivo)",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "Explicação com conexão ao esporte"
  }
]`,

    study_guide: `${context}

TAREFA: Crie um guia de estudo personalizado para 5-7 dias.

Retorne APENAS JSON válido:
{
  "title": "Guia: [Nome do Material]",
  "goal": "O que o aluno dominará ao final",
  "totalDays": 5,
  "days": [
    {
      "day": 1,
      "theme": "Tema do dia",
      "duration": "45 min",
      "activities": [
        {
          "title": "Nome da atividade",
          "description": "O que fazer",
          "sport_connection": "Conexão com ${sports}"
        }
      ]
    }
  ],
  "tips": ["Dica prática 1", "Dica prática 2"]
}`,
  };

  return prompts[type];
}

// ============================================================
// Função principal de geração (interna — não exposta ao aluno)
// ============================================================
export async function generateContent(req: AIRequest): Promise<AIResult> {
  const client = getClient();
  const systemPrompt = buildSystemPrompt(req.profile);
  const userPrompt = buildUserPrompt(req);

  logger.debug('Processando material automaticamente', {
    type: req.type,
    varkStyle: req.profile.varkStyle,
    materialTitle: req.materialTitle,
  });

  try {
    const response = await client.chat.completions.create({
      model: config.ai.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3500,
    });

    const content = response.choices[0]?.message?.content || '';
    return { content, model: config.ai.openai.model };
  } catch (error) {
    logger.error('Erro no processamento de material', { error });
    throw error;
  }
}

/**
 * Prepara o texto de um material para o pipeline
 */
export function prepareMaterialText(
  title: string,
  description?: string | null,
  extractedText?: string | null,
  attachmentTitles?: string[]
): string {
  const parts: string[] = [];
  if (title) parts.push(`Título: ${title}`);
  if (description) parts.push(`Descrição: ${description}`);
  if (extractedText) parts.push(`Conteúdo extraído: ${extractedText}`);
  if (attachmentTitles?.length) {
    parts.push(`Arquivos: ${attachmentTitles.join(', ')}`);
  }
  return parts.join('\n\n').slice(0, 6000);
}

/**
 * Verifica se a integração de IA está disponível
 */
export function isAIAvailable(): boolean {
  return !!config.ai.openai.apiKey;
}
