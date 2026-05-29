/**
 * ContentStatusPanel — Painel de status do conteúdo de um material
 *
 * Antigo AIGeneratorPanel ("Gerar conteúdo com IA").
 * Agora mostra apenas o status: disponível ou em preparação.
 * Sem botões de geração — tudo é automático.
 */
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Brain, BookOpen, Map, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import type { ContentType } from '../../types';

interface Props {
  materialId?: string;
  courseId?: string;
}

const CONTENT_META: Record<ContentType, { label: string; icon: typeof FileText }> = {
  summary: { label: 'Resumo', icon: FileText },
  flashcards: { label: 'Flashcards', icon: Brain },
  quiz: { label: 'Quiz', icon: BookOpen },
  study_guide: { label: 'Guia de Estudo', icon: Map },
};

async function fetchMaterialContent(materialId: string) {
  const { data } = await api.get<{
    success: boolean;
    data: { content: Record<ContentType, unknown | null>; hasContent: boolean };
  }>(`/ai/material/${materialId}`);
  return data.data;
}

export default function ContentStatusPanel({ materialId, courseId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['material-content', materialId],
    queryFn: () => fetchMaterialContent(materialId!),
    enabled: !!materialId,
    refetchInterval: 20000,
  });

  const targetPath = materialId ? `/materiais/${materialId}` : '/materiais';

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Material de Estudo</h3>
          <p className="text-xs text-indigo-600">Preparado automaticamente</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {(['summary', 'flashcards', 'quiz', 'study_guide'] as ContentType[]).map((t) => (
            <div key={t} className="h-7 bg-white/60 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5 mb-4">
          {(['summary', 'flashcards', 'quiz', 'study_guide'] as ContentType[]).map((type) => {
            const meta = CONTENT_META[type];
            const available = data?.content?.[type] != null;
            return (
              <div key={type} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-medium ${
                available
                  ? 'bg-white border-emerald-100 text-emerald-700'
                  : 'bg-white/50 border-white/60 text-gray-400'
              }`}>
                {available
                  ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  : <Clock className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />}
                <meta.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{meta.label}</span>
                {available && <span className="ml-auto text-emerald-500">Disponível</span>}
              </div>
            );
          })}
        </div>
      )}

      <Link
        to={targetPath}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        Ver material completo <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
