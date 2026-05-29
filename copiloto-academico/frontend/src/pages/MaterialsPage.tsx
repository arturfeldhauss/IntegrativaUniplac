/**
 * Materiais de Estudo
 *
 * Exibe o conteúdo já preparado automaticamente pela plataforma.
 * Sem botões "Gerar" — tudo está disponível ou em preparação.
 *
 * O aluno vê: "Resumo disponível", "Flashcards disponíveis", etc.
 * A plataforma já fez o trabalho nos bastidores.
 */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, BookOpen, Brain, Map, GraduationCap,
  ChevronRight, Clock, CheckCircle2, Search,
  ArrowLeft, Copy, Check,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/LoadingSpinner';
import type { Course, GeneratedContent, ContentType, Flashcard, QuizQuestion, StudyGuide } from '../types';

// ============================================================
// Tipos e helpers
// ============================================================

const CONTENT_META: Record<ContentType, { label: string; icon: typeof FileText; color: string; bg: string; description: string }> = {
  summary: {
    label: 'Resumo',
    icon: FileText,
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-100',
    description: 'Resumo adaptado ao seu perfil de aprendizagem',
  },
  flashcards: {
    label: 'Flashcards',
    icon: Brain,
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-100',
    description: 'Cards de revisão com contexto esportivo',
  },
  quiz: {
    label: 'Quiz',
    icon: BookOpen,
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-100',
    description: 'Questões de autoavaliação',
  },
  study_guide: {
    label: 'Guia de Estudo',
    icon: Map,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-100',
    description: 'Plano de estudo personalizado',
  },
};

function safeJSON<T>(str: string): T | null {
  try {
    const cleaned = str.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

// ============================================================
// Sub-componentes de visualização
// ============================================================

function FlashcardsView({ content }: { content: string }) {
  const cards = safeJSON<Flashcard[]>(content);
  const [flipped, setFlipped] = useState<number | null>(null);

  if (!cards) return <pre className="text-sm text-gray-600 whitespace-pre-wrap">{content}</pre>;

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          onClick={() => setFlipped(flipped === i ? null : i)}
          className="cursor-pointer"
          whileHover={{ scale: 1.01 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {flipped !== i ? (
              <motion.div
                key="front"
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 min-h-[90px] flex flex-col justify-between"
              >
                <p className="text-sm font-medium text-indigo-900">{card.front}</p>
                <p className="text-xs text-indigo-400 mt-2">Toque para ver a resposta</p>
              </motion.div>
            ) : (
              <motion.div
                key="back"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 min-h-[90px]"
              >
                <p className="text-sm text-emerald-800">{card.back}</p>
                {card.sport_example && (
                  <div className="mt-2 pt-2 border-t border-emerald-200">
                    <p className="text-xs text-emerald-600">🏃 {card.sport_example}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

function QuizView({ content }: { content: string }) {
  const questions = safeJSON<QuizQuestion[]>(content);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  if (!questions) return <pre className="text-sm text-gray-600 whitespace-pre-wrap">{content}</pre>;

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={qi} className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-900 mb-3">
            <span className="text-indigo-500 font-bold">{qi + 1}. </span>{q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((option, oi) => {
              const isSelected = selected[qi] === oi;
              const isRevealed = revealed.has(qi);
              const isCorrect = oi === q.correct;
              let cls = 'border-gray-200 bg-white text-gray-700';
              if (isRevealed) {
                if (isCorrect) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800';
                else if (isSelected) cls = 'border-red-300 bg-red-50 text-red-700';
              } else if (isSelected) cls = 'border-indigo-400 bg-indigo-50 text-indigo-800';
              return (
                <button key={oi}
                  onClick={() => { if (!isRevealed) setSelected({ ...selected, [qi]: oi }); }}
                  className={`w-full text-left text-sm p-3 rounded-lg border-2 transition-all ${cls}`}
                >
                  {['A', 'B', 'C', 'D'][oi]}. {option}
                </button>
              );
            })}
          </div>
          {selected[qi] !== undefined && !revealed.has(qi) && (
            <button onClick={() => setRevealed(new Set([...revealed, qi]))}
              className="mt-2 text-xs text-indigo-600 font-medium hover:underline">
              Ver resposta
            </button>
          )}
          {revealed.has(qi) && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-800"><strong>Explicação:</strong> {q.explanation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StudyGuideView({ content }: { content: string }) {
  const guide = safeJSON<StudyGuide>(content);
  if (!guide) return <pre className="text-sm text-gray-600 whitespace-pre-wrap">{content}</pre>;

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 rounded-xl p-4">
        <h4 className="font-semibold text-indigo-900">{guide.title}</h4>
        <p className="text-sm text-indigo-700 mt-1">{guide.goal}</p>
      </div>
      {guide.days?.map((day) => (
        <div key={day.day} className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">{day.day}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{day.theme}</p>
              <p className="text-xs text-gray-400">{day.duration}</p>
            </div>
          </div>
          <div className="space-y-2">
            {day.activities?.map((act, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-800">{act.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{act.description}</p>
                {act.sport_connection && <p className="text-xs text-emerald-600 mt-1">🏃 {act.sport_connection}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {guide.tips?.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-800 mb-2">💡 Dicas</p>
          <ul className="space-y-1">
            {guide.tips.map((tip, i) => <li key={i} className="text-xs text-amber-700">• {tip}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryView({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
      {content}
    </div>
  );
}

// ============================================================
// Badge de status
// ============================================================
function StatusBadge({ available, type }: { available: boolean; type: ContentType }) {
  const meta = CONTENT_META[type];
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
      available ? meta.bg + ' ' + meta.color : 'bg-gray-50 border-gray-100 text-gray-400'
    }`}>
      {available ? (
        <><CheckCircle2 className="w-3 h-3" /> {meta.label}</>
      ) : (
        <><Clock className="w-3 h-3 animate-pulse" /> {meta.label}</>
      )}
    </div>
  );
}

// ============================================================
// API
// ============================================================
async function fetchCourses(): Promise<Course[]> {
  const { data } = await api.get<{ success: boolean; data: Course[] }>('/courses');
  return data.data;
}

async function fetchMaterialContent(materialId: string) {
  const { data } = await api.get<{
    success: boolean;
    data: {
      material: { id: string; title: string; course: { name: string } };
      content: Record<ContentType, GeneratedContent | null>;
      hasContent: boolean;
    };
  }>(`/ai/material/${materialId}`);
  return data.data;
}

async function fetchCourseContentStatus(courseId: string) {
  const { data } = await api.get<{
    success: boolean;
    data: {
      courseId: string;
      courseName: string;
      materials: Array<{ materialId: string; materialTitle: string; availableTypes: ContentType[]; isProcessed: boolean }>;
      processedCount: number;
      totalCount: number;
    };
  }>(`/ai/course/${courseId}`);
  return data.data;
}

// ============================================================
// Componente principal
// ============================================================
export default function MaterialsPage() {
  const { materialId } = useParams<{ materialId?: string }>();
  const { user } = useAuth();

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materialId || '');
  const [activeType, setActiveType] = useState<ContentType>('summary');
  const [copied, setCopied] = useState(false);

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const { data: courseStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['course-content', selectedCourseId],
    queryFn: () => fetchCourseContentStatus(selectedCourseId),
    enabled: !!selectedCourseId,
    refetchInterval: 30000, // revalida a cada 30s para capturar conteúdo novo
  });

  const { data: materialContent, isLoading: contentLoading } = useQuery({
    queryKey: ['material-content', selectedMaterialId],
    queryFn: () => fetchMaterialContent(selectedMaterialId),
    enabled: !!selectedMaterialId,
    refetchInterval: 15000,
  });

  const profile = user?.learningProfile;
  const activeContent = materialContent?.content[activeType];

  function handleCopy() {
    if (!activeContent) return;
    navigator.clipboard.writeText(activeContent.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function renderContent(item: GeneratedContent) {
    switch (item.type) {
      case 'flashcards': return <FlashcardsView content={item.content} />;
      case 'quiz': return <QuizView content={item.content} />;
      case 'study_guide': return <StudyGuideView content={item.content} />;
      default: return <SummaryView content={item.content} />;
    }
  }

  if (coursesLoading) return <PageLoader />;

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Materiais de Estudo</h1>
        <p className="text-gray-500 mt-1">
          {profile
            ? `Conteúdo personalizado para o seu perfil${profile.careerGoal ? ` · ${profile.careerGoal}` : ''}`
            : 'Selecione uma disciplina para ver os materiais disponíveis'}
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* Painel esquerdo — navegação */}
        <div className="lg:col-span-2 space-y-4">

          {/* Selecionar disciplina */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              Disciplina
            </h3>
            <div className="space-y-2">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => { setSelectedCourseId(course.id); setSelectedMaterialId(''); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                    selectedCourseId === course.id
                      ? 'bg-indigo-50 text-indigo-700 font-medium border border-indigo-100'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{course.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                  </div>
                </button>
              ))}
              {courses.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Nenhuma disciplina importada.{' '}
                  <Link to="/dashboard" className="text-indigo-500 hover:underline">Sincronize o Classroom</Link>
                </p>
              )}
            </div>
          </div>

          {/* Lista de materiais com status */}
          {selectedCourseId && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Materiais</h3>
                {courseStatus && (
                  <span className="text-xs text-gray-400">
                    {courseStatus.processedCount}/{courseStatus.totalCount} prontos
                  </span>
                )}
              </div>

              {statusLoading ? (
                <div className="py-6 text-center text-gray-400 text-sm">Carregando...</div>
              ) : courseStatus?.materials.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum material encontrado</p>
              ) : (
                <div className="space-y-2">
                  {courseStatus?.materials.map((m) => (
                    <button
                      key={m.materialId}
                      onClick={() => setSelectedMaterialId(m.materialId)}
                      className={`w-full text-left p-3 rounded-xl transition-all border ${
                        selectedMaterialId === m.materialId
                          ? 'bg-indigo-50 border-indigo-200'
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate flex-1">{m.materialTitle}</p>
                        {m.isProcessed ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> Disponível
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex-shrink-0">
                            <Clock className="w-3 h-3 animate-pulse" /> Preparando
                          </span>
                        )}
                      </div>
                      {m.isProcessed && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {m.availableTypes.map((t) => {
                            const meta = CONTENT_META[t];
                            return (
                              <span key={t} className={`text-xs px-1.5 py-0.5 rounded-md ${meta.bg} ${meta.color} border`}>
                                {meta.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Painel direito — conteúdo */}
        <div className="lg:col-span-3">
          {!selectedMaterialId ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 min-h-[400px] flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-500">Selecione um material</p>
                <p className="text-sm text-gray-400 mt-1">
                  Escolha uma disciplina e um material para ver o conteúdo disponível
                </p>
              </div>
            </div>
          ) : contentLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">Carregando conteúdo...</p>
              </div>
            </div>
          ) : !materialContent?.hasContent ? (
            <div className="bg-white rounded-2xl border border-gray-100 min-h-[400px] flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">Preparando seu material</p>
                <p className="text-sm text-gray-400 mt-1 max-w-sm">
                  A plataforma está processando este material com base no seu perfil.
                  Isso acontece automaticamente — volte em alguns instantes.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                {(['summary', 'flashcards', 'quiz', 'study_guide'] as ContentType[]).map((t) => {
                  const meta = CONTENT_META[t];
                  return (
                    <div key={t} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <Clock className="w-4 h-4 text-gray-300" />
                      <span className="text-sm text-gray-400">{meta.label} em preparação...</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Tabs de tipo de conteúdo */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {materialContent.material.title}
                  </h3>
                  {activeContent && (
                    <button
                      onClick={handleCopy}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Copiar conteúdo"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {(['summary', 'flashcards', 'quiz', 'study_guide'] as ContentType[]).map((t) => {
                    const meta = CONTENT_META[t];
                    const available = !!materialContent.content[t];
                    return (
                      <button
                        key={t}
                        onClick={() => available && setActiveType(t)}
                        disabled={!available}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all ${
                          activeType === t && available
                            ? `${meta.bg} ${meta.color} border-current`
                            : available
                            ? 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200'
                            : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                        }`}
                      >
                        <meta.icon className="w-3.5 h-3.5" />
                        {meta.label}
                        {!available && <Clock className="w-2.5 h-2.5 animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-5 max-h-[600px] overflow-y-auto">
                {activeContent ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeType}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {renderContent(activeContent)}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="w-8 h-8 text-gray-300 animate-pulse mb-3" />
                    <p className="text-sm text-gray-500">
                      {CONTENT_META[activeType].label} ainda sendo preparado...
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
