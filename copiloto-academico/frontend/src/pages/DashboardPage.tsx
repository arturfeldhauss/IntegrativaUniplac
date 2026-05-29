/**
 * Dashboard — Página principal do aluno
 *
 * Mostra o estado da plataforma de forma automática e personalizada.
 * Sem botões "Gerar" — todo conteúdo já está disponível ou em preparação.
 */
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen, Calendar, Zap, GraduationCap,
  ArrowRight, ChevronRight, CheckCircle2, Clock,
  FileText, Brain, Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { VARK_STYLE_LABELS, VARK_STYLE_EMOJIS, VARK_STYLE_COLORS } from '../data/varkQuestions';
import type { DashboardData } from '../types';

async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await api.get<{ success: boolean; data: DashboardData }>('/courses/dashboard');
  return data.data;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }),
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Sem prazo';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
    ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) return <PageLoader />;

  const profile = user?.learningProfile || dashboard?.learningProfile;
  const primaryColors = profile ? VARK_STYLE_COLORS[profile.primaryStyle] : null;
  const sports = profile?.sportsProfile?.practiced?.slice(0, 3) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {profile
              ? `${VARK_STYLE_EMOJIS[profile.primaryStyle]} Perfil ${VARK_STYLE_LABELS[profile.primaryStyle]}${profile.careerGoal ? ` · ${profile.careerGoal}` : ''}`
              : 'Complete o onboarding para personalizar sua experiência'}
          </p>
        </div>
      </motion.div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Disciplinas', value: dashboard?.stats.totalCourses || 0, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Materiais', value: dashboard?.stats.totalMaterials || 0, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Atividades', value: dashboard?.stats.totalAssignments || 0, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Prazos próximos', value: dashboard?.upcomingAssignments.length || 0, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={cardVariants} initial="hidden" animate="visible"
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-5">

          {/* Card de perfil */}
          {profile && primaryColors ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className={`rounded-2xl p-5 border ${primaryColors.border} ${primaryColors.bg}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{VARK_STYLE_EMOJIS[profile.primaryStyle]}</span>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${primaryColors.text}`}>
                      Perfil de Aprendizagem
                    </span>
                  </div>
                  <h3 className={`text-xl font-bold ${primaryColors.text}`}>
                    Aprendiz {VARK_STYLE_LABELS[profile.primaryStyle]}
                  </h3>
                  {profile.secondaryStyle && (
                    <p className={`text-sm mt-0.5 ${primaryColors.text} opacity-70`}>
                      Com traços de {VARK_STYLE_LABELS[profile.secondaryStyle].toLowerCase()}
                    </p>
                  )}
                  {profile.careerGoal && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Target className={`w-3.5 h-3.5 ${primaryColors.text} opacity-60`} />
                      <p className={`text-xs ${primaryColors.text} opacity-70`}>{profile.careerGoal}</p>
                    </div>
                  )}
                </div>
                <Link to="/onboarding" className={`text-xs font-medium ${primaryColors.text} hover:underline opacity-60 hover:opacity-100`}>
                  Editar perfil
                </Link>
              </div>

              {/* Barras VARK */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                {['visual', 'auditory', 'reading', 'kinesthetic'].map((key) => {
                  const score = profile[`${key}Score` as keyof typeof profile] as number || 0;
                  const maxScore = Math.max(profile.visualScore, profile.auditoryScore, profile.readingScore, profile.kinestheticScore);
                  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
                  const colors = VARK_STYLE_COLORS[key];
                  return (
                    <div key={key} className="text-center">
                      <p className={`text-xs mb-1 ${primaryColors.text} opacity-70`}>{VARK_STYLE_EMOJIS[key]}</p>
                      <div className="h-1 bg-white/50 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className={`text-xs font-bold mt-1 ${primaryColors.text}`}>{score}</p>
                    </div>
                  );
                })}
              </div>

              {/* Esportes */}
              {sports.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {sports.map((s) => (
                    <span key={s} className={`text-xs px-2.5 py-1 rounded-full ${primaryColors.bg} ${primaryColors.text} border ${primaryColors.border} font-medium opacity-80`}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              className="rounded-2xl p-5 border-2 border-dashed border-indigo-200 bg-indigo-50">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🧠</span>
                <div>
                  <h3 className="font-semibold text-indigo-900">Configure seu perfil de aprendizagem</h3>
                  <p className="text-sm text-indigo-600">A plataforma adapta o conteúdo automaticamente ao seu perfil</p>
                </div>
                <Link to="/onboarding"
                  className="ml-auto flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap">
                  Configurar <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* Disciplinas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Suas Disciplinas</h2>
              <Link to="/courses" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Ver todas <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {!dashboard?.courses.length ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhuma disciplina importada ainda</p>
                <p className="text-gray-400 text-sm mt-1">Use o botão "Atualizar Classroom" na barra superior</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {dashboard.courses.slice(0, 4).map((course, i) => (
                  <motion.div key={course.id} custom={i + 4} variants={cardVariants} initial="hidden" animate="visible">
                    <Link to={`/courses/${course.id}`}
                      className="block bg-white rounded-2xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{course.name}</h3>
                      {course.section && <p className="text-xs text-gray-400 mb-2">{course.section}</p>}
                      <div className="flex gap-3">
                        <span className="text-xs text-gray-400">{course._count?.materials || 0} materiais</span>
                        <span className="text-xs text-gray-400">{course._count?.assignments || 0} atividades</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita */}
        <div className="space-y-5">

          {/* Atividades com prazo */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              Prazos próximos
            </h2>
            {!dashboard?.upcomingAssignments.length ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum prazo próximo 🎉</p>
            ) : (
              <div className="space-y-3">
                {dashboard.upcomingAssignments.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400">{a.course?.name} · {formatDate(a.dueDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Materiais recentes */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Materiais recentes
            </h2>
            {!dashboard?.recentMaterials.length ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum material importado</p>
            ) : (
              <div className="space-y-3">
                {dashboard.recentMaterials.map((m) => (
                  <Link key={m.id} to={`/materiais/${m.id}`} className="flex items-start gap-3 group">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{m.title}</p>
                      <p className="text-xs text-gray-400 truncate">{m.course?.name}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 mt-0.5 transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Acesso rápido aos materiais de estudo */}
          {profile && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-5 text-white">
              <p className="text-xs font-medium text-indigo-300 uppercase tracking-wider mb-2">
                📚 Materiais de Estudo
              </p>
              <p className="text-sm leading-relaxed mb-3">
                Resumos, flashcards e guias de estudo adaptados ao seu perfil
                {profile.careerGoal ? ` para ${profile.careerGoal}` : ''}.
              </p>
              <Link to="/materiais"
                className="flex items-center gap-1 text-xs font-medium text-indigo-300 hover:text-white transition-colors">
                Ver materiais disponíveis <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
