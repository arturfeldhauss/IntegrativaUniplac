/**
 * Página de listagem de disciplinas
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, FileText, Zap, GraduationCap,
  ArrowRight, Clock, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import { useState } from 'react';
import api from '../services/api';
import { PageLoader } from '../components/ui/LoadingSpinner';
import type { Course, PreparationStatus } from '../types';

async function fetchCourses(): Promise<Course[]> {
  const { data } = await api.get<{ success: boolean; data: Course[] }>('/courses');
  return data.data;
}

const PREP_STATUS_CONFIG: Record<PreparationStatus, {
  label: string;
  className: string;
  icon: typeof Clock;
  animate?: boolean;
}> = {
  PENDING: {
    label: 'Importada',
    className: 'bg-gray-100 text-gray-500',
    icon: Clock,
  },
  PROCESSING: {
    label: 'Preparando...',
    className: 'bg-amber-50 text-amber-700',
    icon: Loader2,
    animate: true,
  },
  READY: {
    label: 'Material pronto',
    className: 'bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },
  ERROR: {
    label: 'Erro na preparação',
    className: 'bg-red-50 text-red-600',
    icon: AlertCircle,
  },
};

function PreparationBadge({ status }: { status: PreparationStatus }) {
  const cfg = PREP_STATUS_CONFIG[status] ?? PREP_STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.className}`}>
      <Icon className={`w-3 h-3 ${cfg.animate ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

export default function CoursesPage() {
  const [search, setSearch] = useState('');

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    // Polling enquanto alguma disciplina estiver sendo preparada
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasProcessing = data.some((c) => c.preparationStatus === 'PROCESSING');
      return hasProcessing ? 5000 : false;
    },
  });

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.section?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <PageLoader />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disciplinas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {courses.length} disciplina{courses.length !== 1 ? 's' : ''} importada{courses.length !== 1 ? 's' : ''} do Google Classroom
          </p>
        </div>
      </div>

      {courses.length > 0 && (
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar disciplina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          {courses.length === 0 ? (
            <>
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma disciplina importada</p>
              <p className="text-gray-400 text-sm mt-1">
                Use o botão "Sincronizar Classroom" no topo para importar
              </p>
            </>
          ) : (
            <>
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum resultado para "{search}"</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/courses/${course.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <PreparationBadge status={course.preparationStatus ?? 'PENDING'} />
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 mb-1">
                  {course.name}
                </h3>
                {course.section && <p className="text-xs text-gray-400 mb-3">{course.section}</p>}

                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    {course._count?.materials || 0} materiais
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Zap className="w-3.5 h-3.5 text-orange-400" />
                    {course._count?.assignments || 0} atividades
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
