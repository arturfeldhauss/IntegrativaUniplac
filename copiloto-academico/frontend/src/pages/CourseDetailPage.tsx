/**
 * Detalhe de uma disciplina
 *
 * Fluxo de preparação:
 * 1. Abre a disciplina → verifica preparationStatus
 * 2. Se PENDING ou ERROR → dispara POST /courses/:id/prepare automaticamente
 * 3. Enquanto PROCESSING → mostra banner de loading e faz polling a cada 5s
 * 4. Quando READY → exibe materiais com badges de conteúdo disponível
 * 5. Botão "Atualizar material" → POST /courses/:id/refresh (apaga e regenera)
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FileText, Link2, Video, ExternalLink,
  RefreshCw, BookOpen, Calendar, Zap, Megaphone,
  CheckCircle2, Clock, Brain, Map as MapIcon, ChevronRight,
  Loader2, AlertCircle, Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { coursesService } from '../services/courses.service';
import { syncService } from '../services/sync.service';
import { PageLoader } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { Course, Material, Assignment, MaterialAttachment, ContentType, CourseGeneratedContentResponse } from '../types';

type TabType = 'materials' | 'assignments' | 'announcements';

async function fetchCourse(id: string): Promise<Course> {
  const { data } = await api.get<{ success: boolean; data: Course }>(`/courses/${id}`);
  return data.data;
}

// ============================================================
// Sub-componentes
// ============================================================

function AttachmentChip({ att }: { att: MaterialAttachment }) {
  const icon = att.type === 'youtubeVideo'
    ? <Video className="w-3 h-3 text-red-500" />
    : att.type === 'link'
    ? <Link2 className="w-3 h-3 text-blue-500" />
    : <FileText className="w-3 h-3 text-indigo-500" />;

  const label = att.type === 'youtubeVideo' ? 'YouTube'
    : att.type === 'link' ? 'Link'
    : att.mimeType?.includes('pdf') ? 'PDF'
    : att.mimeType?.includes('document') ? 'Google Docs'
    : att.mimeType?.includes('presentation') ? 'Slides'
    : 'Arquivo';

  return (
    <a href={att.url || '#'} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 transition-colors group">
      {icon}
      <span className="truncate max-w-[120px]">{att.title || label}</span>
      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </a>
  );
}

const CONTENT_ICONS: Record<ContentType, typeof FileText> = {
  summary: FileText,
  flashcards: Brain,
  quiz: BookOpen,
  study_guide: MapIcon,
};
const CONTENT_LABELS: Record<ContentType, string> = {
  summary: 'Resumo',
  flashcards: 'Flashcards',
  quiz: 'Quiz',
  study_guide: 'Guia',
};

function MaterialCard({
  material,
  availableTypes,
  isProcessed,
  isPreparing,
}: {
  material: Material;
  availableTypes: ContentType[];
  isProcessed: boolean;
  isPreparing: boolean;
}) {
  const attachments = (material.attachments || []) as MaterialAttachment[];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-100 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-900 text-sm truncate">{material.title}</h4>
            {material.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{material.description}</p>
            )}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {attachments.slice(0, 4).map((att, i) => <AttachmentChip key={i} att={att} />)}
                {attachments.length > 4 && <span className="text-xs text-gray-400">+{attachments.length - 4}</span>}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mt-3">
              {isPreparing ? (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 font-medium">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Preparando...
                </span>
              ) : isProcessed ? (
                <>
                  {(['summary', 'flashcards', 'quiz', 'study_guide'] as ContentType[]).map((type) => {
                    const available = availableTypes.includes(type);
                    const Icon = CONTENT_ICONS[type];
                    return (
                      <span key={type} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                        available
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                        {available ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                        {CONTENT_LABELS[type]}
                      </span>
                    );
                  })}
                  <Link
                    to={`/materiais/${material.id}`}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium ml-auto"
                  >
                    Ver material <ChevronRight className="w-3 h-3" />
                  </Link>
                </>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                  <Clock className="w-2.5 h-2.5" /> Aguardando preparação
                </span>
              )}
            </div>
          </div>
        </div>
        {material.alternateLink && (
          <a href={material.alternateLink} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isOverdue = dueDate && dueDate < new Date();

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-100 transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isOverdue ? 'bg-red-100' : 'bg-orange-100'}`}>
          <Calendar className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-orange-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm">{assignment.title}</h4>
          {assignment.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{assignment.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {dueDate && (
              <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                {isOverdue ? 'Vencido: ' : 'Prazo: '}
                {dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>
            )}
            {assignment.maxPoints && <span className="text-xs text-gray-400">{assignment.maxPoints} pts</span>}
          </div>
        </div>
        {assignment.alternateLink && (
          <a href={assignment.alternateLink} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

function AnnouncementCard({ material }: { material: Material }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Megaphone className="w-4 h-4 text-gray-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{material.description || material.title}</p>
          {material.alternateLink && (
            <a href={material.alternateLink} target="_blank" rel="noopener noreferrer"
              className="mt-1.5 flex items-center gap-1 text-xs text-indigo-600 hover:underline">
              Ver no Classroom <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Banner de status de preparação
// ============================================================
function PreparationBanner({
  status,
  error,
  onRetry,
}: {
  status: string;
  error: string | null;
  onRetry: () => void;
}) {
  if (status === 'PROCESSING') {
    return (
      <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <Loader2 className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Preparando seu material personalizado...</p>
          <p className="text-xs text-amber-600 mt-0.5">Gerando resumos e flashcards adaptados ao seu perfil.</p>
        </div>
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div className="mb-5 flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Falha na preparação</p>
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
          </div>
        </div>
        <button
          onClick={onRetry}
          className="flex-shrink-0 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return null;
}

// ============================================================
// Componente principal
// ============================================================
export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('materials');

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => fetchCourse(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.preparationStatus;
      return status === 'PROCESSING' ? 5000 : false;
    },
  });

  const { data: courseContent } = useQuery<CourseGeneratedContentResponse>({
    queryKey: ['course-generated-content', id],
    queryFn: () => coursesService.getGeneratedContent(id!),
    enabled: !!id && course?.preparationStatus === 'READY',
    refetchInterval: false,
  });

  // Dispara preparação automaticamente ao abrir a disciplina
  const prepareMutation = useMutation({
    mutationFn: () => coursesService.prepare(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: () => toast.error('Erro ao iniciar preparação'),
  });

  useEffect(() => {
    if (!course) return;
    if (course.preparationStatus === 'PENDING' || course.preparationStatus === 'ERROR') {
      prepareMutation.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id, course?.preparationStatus]);

  // Recarrega conteúdo quando ficar READY
  useEffect(() => {
    if (course?.preparationStatus === 'READY') {
      queryClient.invalidateQueries({ queryKey: ['course-generated-content', id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  }, [course?.preparationStatus, id, queryClient]);

  const syncMutation = useMutation({
    mutationFn: () => syncService.syncCourse(id!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      toast.success(`Atualizado! ${result.materialsCount} materiais importados`);
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const refreshMutation = useMutation({
    mutationFn: () => coursesService.refreshContent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['course-generated-content', id] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Regeneração iniciada');
    },
    onError: () => toast.error('Erro ao regenerar conteúdo'),
  });

  if (isLoading) return <PageLoader />;
  if (!course) return <div className="p-6 text-gray-500">Disciplina não encontrada</div>;

  const materials = (course.materials || []).filter((m) => m.type === 'material');
  const announcements = (course.materials || []).filter((m) => m.type === 'announcement');
  const assignments = course.assignments || [];

  const contentStatusMap = new Map(
    courseContent?.materials.map((m) => [m.materialId, m]) || []
  );

  const isPreparing = course.preparationStatus === 'PROCESSING';
  const isReady = course.preparationStatus === 'READY';

  const tabs: { key: TabType; label: string; count: number; icon: typeof BookOpen }[] = [
    { key: 'materials', label: 'Materiais', count: materials.length, icon: BookOpen },
    { key: 'assignments', label: 'Atividades', count: assignments.length, icon: Zap },
    { key: 'announcements', label: 'Anúncios', count: announcements.length, icon: Megaphone },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <Link to="/courses"
            className="mt-1 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
            {course.section && <p className="text-gray-500 text-sm mt-0.5">{course.section}</p>}
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                course.courseState === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {course.courseState === 'ACTIVE' ? 'Ativa' : 'Arquivada'}
              </span>
              <span className="text-xs text-gray-400">
                {course._count?.materials || 0} materiais · {course._count?.assignments || 0} atividades
              </span>
              {isReady && courseContent && (
                <span className="text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3 h-3 inline mr-0.5" />
                  {courseContent.processedCount}/{courseContent.totalCount} prontos
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sincronizar dados do Classroom */}
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || isPreparing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar'}
          </button>

          {/* Atualizar material personalizado — só aparece quando já tem conteúdo */}
          {isReady && (
            <button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
              {refreshMutation.isPending ? 'Atualizando...' : 'Atualizar material'}
            </button>
          )}
        </div>
      </div>

      {/* Banner de preparação */}
      <PreparationBanner
        status={course.preparationStatus}
        error={course.preparationError}
        onRetry={() => prepareMutation.mutate()}
      />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Conteúdo principal */}
        <div className="lg:col-span-3">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'
                  }`}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-3">
            {activeTab === 'materials' && (
              materials.length > 0
                ? materials.map((m) => {
                    const status = contentStatusMap.get(m.id);
                    return (
                      <MaterialCard
                        key={m.id}
                        material={m}
                        availableTypes={status?.availableTypes || []}
                        isProcessed={status?.isProcessed || false}
                        isPreparing={isPreparing}
                      />
                    );
                  })
                : <div className="text-center py-12 text-gray-400">Nenhum material encontrado</div>
            )}
            {activeTab === 'assignments' && (
              assignments.length > 0
                ? assignments.map((a) => <AssignmentCard key={a.id} assignment={a} />)
                : <div className="text-center py-12 text-gray-400">Nenhuma atividade encontrada</div>
            )}
            {activeTab === 'announcements' && (
              announcements.length > 0
                ? announcements.map((a) => <AnnouncementCard key={a.id} material={a} />)
                : <div className="text-center py-12 text-gray-400">Nenhum anúncio encontrado</div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Material Personalizado</h3>
                <p className="text-xs text-indigo-600">
                  {isPreparing ? 'Gerando...' : isReady ? 'Pronto para estudar' : 'Pendente'}
                </p>
              </div>
            </div>

            {isPreparing && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Preparando conteúdo...
              </div>
            )}

            {isReady && courseContent && (
              <>
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Materiais prontos</span>
                    <span className="text-xs font-medium text-gray-700">
                      {courseContent.processedCount}/{courseContent.totalCount}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                      style={{ width: courseContent.totalCount > 0 ? `${(courseContent.processedCount / courseContent.totalCount) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <Link
                  to={`/materiais?curso=${course.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Ver materiais disponíveis
                </Link>
              </>
            )}

            {course.preparationStatus === 'PENDING' && !isPreparing && (
              <p className="text-xs text-gray-500">Iniciando preparação...</p>
            )}
          </div>

          {course.description && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sobre a disciplina</h4>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">{course.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
