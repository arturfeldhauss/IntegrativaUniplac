/**
 * OnboardingPage — Configuração do Perfil Inteligente do Aluno
 *
 * 4 etapas para a plataforma entender quem é o aluno:
 * 1. VARK — Estilo de aprendizagem
 * 2. Perfil Esportivo — Esportes, modalidades, nível
 * 3. Objetivo Profissional — Área de interesse na EF
 * 4. Preferências de Estudo — Como prefere receber o conteúdo
 *
 * Ao final, tudo é salvo e a plataforma começa a adaptar o conteúdo
 * automaticamente — sem que o aluno precise pedir nada.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, CheckCircle,
  GraduationCap, Dumbbell, Target, BookOpen,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { VARK_QUESTIONS, VARK_STYLE_LABELS, VARK_STYLE_EMOJIS, VARK_STYLE_COLORS } from '../data/varkQuestions';
import { varkService } from '../services/vark.service';
import { useAuth } from '../context/AuthContext';
import type { VarkAnswer, VarkDimension, VarkResult, SportsProfile, StudyPreference } from '../types';

// ============================================================
// Dados do onboarding
// ============================================================

const SPORTS_OPTIONS = [
  'Futebol', 'Padel', 'Musculação', 'Corrida', 'Crossfit',
  'Vôlei', 'Basquete', 'Tênis', 'Natação', 'Ciclismo',
  'MMA / Artes Marciais', 'Handball', 'Rugby', 'Futsal',
  'Atletismo', 'Surf', 'Skate', 'Outro',
];

const CAREER_OPTIONS = [
  { value: 'Biomecânica Esportiva', icon: '⚙️', description: 'Análise do movimento humano e performance' },
  { value: 'Fisiologia do Exercício', icon: '🫁', description: 'Respostas e adaptações ao exercício físico' },
  { value: 'Treinamento Esportivo', icon: '🏋️', description: 'Periodização, técnica e preparação física' },
  { value: 'Reabilitação e Fisioterapia', icon: '🩺', description: 'Prevenção e recuperação de lesões' },
  { value: 'Personal Trainer / Musculação', icon: '💪', description: 'Prescrição individual e condicionamento' },
  { value: 'Alto Rendimento', icon: '🥇', description: 'Suporte a atletas de elite' },
  { value: 'Educação Física Escolar', icon: '🎒', description: 'Docência e desenvolvimento na escola' },
  { value: 'Saúde e Bem-Estar', icon: '🌿', description: 'Promoção da saúde e qualidade de vida' },
  { value: 'Gestão Esportiva', icon: '📋', description: 'Administração, clubes e eventos esportivos' },
  { value: 'Nutrição Esportiva', icon: '🥗', description: 'Alimentação para performance' },
  { value: 'Outro', icon: '🎯', description: 'Outra área de interesse' },
];

const LEVELS = [
  { value: 'Iniciante', label: 'Iniciante', description: 'Começando a praticar', emoji: '🌱' },
  { value: 'Intermediário', label: 'Intermediário', description: 'Pratico regularmente', emoji: '📈' },
  { value: 'Avançado', label: 'Avançado', description: 'Nível técnico alto', emoji: '⚡' },
  { value: 'Atleta', label: 'Atleta', description: 'Competição / alta performance', emoji: '🏆' },
];

// ============================================================
// Componente de chip multi-seleção
// ============================================================
function MultiSelectChip({
  options,
  selected,
  onToggle,
  maxSelect,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  maxSelect?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        const isDisabled = !isSelected && maxSelect !== undefined && selected.length >= maxSelect;
        return (
          <button
            key={opt}
            onClick={() => !isDisabled && onToggle(opt)}
            disabled={isDisabled}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
              isSelected
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : isDisabled
                ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Etapa 1 — VARK
// ============================================================
function StepVark({
  answers,
  onComplete,
}: {
  answers: VarkAnswer[];
  onComplete: (answers: VarkAnswer[]) => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const [localAnswers, setLocalAnswers] = useState<VarkAnswer[]>(answers);
  const [selected, setSelected] = useState<VarkDimension | null>(
    answers.find((a) => a.questionId === VARK_QUESTIONS[0]?.id)?.answer || null
  );

  const total = VARK_QUESTIONS.length;
  const progress = ((currentQ + 1) / total) * 100;
  const question = VARK_QUESTIONS[currentQ];
  const currentAnswer = localAnswers.find((a) => a.questionId === question?.id);

  function handleSelect(val: VarkDimension) {
    setSelected(val);
  }

  function handleNext() {
    if (!selected && !currentAnswer) return;
    const chosen = selected || currentAnswer!.answer;
    const newAnswers = [
      ...localAnswers.filter((a) => a.questionId !== question.id),
      { questionId: question.id, answer: chosen },
    ];
    setLocalAnswers(newAnswers);

    if (currentQ < total - 1) {
      const nextQ = VARK_QUESTIONS[currentQ + 1];
      const nextAnswer = newAnswers.find((a) => a.questionId === nextQ.id);
      setSelected(nextAnswer?.answer || null);
      setCurrentQ(currentQ + 1);
    } else {
      onComplete(newAnswers);
    }
  }

  function handleBack() {
    if (currentQ > 0) {
      const prevQ = VARK_QUESTIONS[currentQ - 1];
      const prevAnswer = localAnswers.find((a) => a.questionId === prevQ.id);
      setSelected(prevAnswer?.answer || null);
      setCurrentQ(currentQ - 1);
    }
  }

  return (
    <div className="space-y-6">
      {/* Progresso */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-indigo-300">Questão {currentQ + 1} de {total}</span>
          <span className="text-sm text-indigo-300">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
          />
        </div>
      </div>

      {/* Card da questão */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-bold">
              {currentQ + 1}
            </span>
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Situação de aprendizagem
            </span>
          </div>
          <h2 className="text-gray-900 font-semibold text-lg leading-snug mb-5">
            {question.text}
          </h2>
          <div className="space-y-3">
            {question.options.map((option, i) => {
              const isSelected = selected === option.value || currentAnswer?.answer === option.value;
              return (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
                      isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="w-full h-full text-white p-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </motion.svg>
                      )}
                    </div>
                    <span className="text-sm leading-relaxed">{option.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navegação */}
      <div className="flex gap-3">
        {currentQ > 0 && (
          <button onClick={handleBack}
            className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Anterior
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!selected && !currentAnswer}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
            selected || currentAnswer
              ? 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg'
              : 'bg-white/20 text-white/40 cursor-not-allowed'
          }`}
        >
          {currentQ < total - 1 ? (
            <> Próxima <ArrowRight className="w-4 h-4" /></>
          ) : (
            <> Próxima etapa <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {/* Indicadores */}
      <div className="flex gap-1 justify-center flex-wrap">
        {VARK_QUESTIONS.map((q, i) => {
          const answered = localAnswers.some((a) => a.questionId === q.id);
          return (
            <div key={q.id} className={`h-1.5 rounded-full transition-all ${
              i === currentQ ? 'bg-white w-5' : answered ? 'bg-indigo-400 w-1.5' : 'bg-white/20 w-1.5'
            }`} />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Etapa 2 — Perfil Esportivo
// ============================================================
function StepSports({
  value,
  onChange,
}: {
  value: SportsProfile;
  onChange: (v: SportsProfile) => void;
}) {
  function toggle(field: keyof Pick<SportsProfile, 'practiced' | 'liked' | 'followed'>, sport: string) {
    const current = value[field];
    const updated = current.includes(sport)
      ? current.filter((s) => s !== sport)
      : [...current, sport];
    onChange({ ...value, [field]: updated });
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Quais esportes você pratica?</h3>
        <p className="text-xs text-gray-400 mb-3">Selecione todos que praticar</p>
        <MultiSelectChip
          options={SPORTS_OPTIONS}
          selected={value.practiced}
          onToggle={(s) => toggle('practiced', s)}
        />
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-semibold text-gray-900 mb-1">Quais esportes você mais gosta?</h3>
        <p className="text-xs text-gray-400 mb-3">Mesmo que não pratique</p>
        <MultiSelectChip
          options={SPORTS_OPTIONS}
          selected={value.liked}
          onToggle={(s) => toggle('liked', s)}
        />
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-semibold text-gray-900 mb-1">Quais modalidades você mais acompanha?</h3>
        <p className="text-xs text-gray-400 mb-3">Na TV, redes sociais, ao vivo…</p>
        <MultiSelectChip
          options={SPORTS_OPTIONS}
          selected={value.followed}
          onToggle={(s) => toggle('followed', s)}
        />
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-semibold text-gray-900 mb-3">Qual é o seu nível?</h3>
        <div className="grid grid-cols-2 gap-3">
          {LEVELS.map((lvl) => (
            <button
              key={lvl.value}
              onClick={() => onChange({ ...value, level: lvl.value })}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                value.level === lvl.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <span className="text-xl">{lvl.emoji}</span>
              <p className={`text-sm font-semibold mt-1 ${value.level === lvl.value ? 'text-indigo-800' : 'text-gray-800'}`}>
                {lvl.label}
              </p>
              <p className="text-xs text-gray-500">{lvl.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Etapa 3 — Objetivo Profissional
// ============================================================
function StepCareer({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <p className="text-xs text-gray-400 mb-4">
        A plataforma vai adaptar o conteúdo para a sua área de interesse.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {CAREER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              value === opt.value
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-200'
            }`}
          >
            <span className="text-2xl">{opt.icon}</span>
            <p className={`text-sm font-semibold mt-2 ${value === opt.value ? 'text-indigo-800' : 'text-gray-800'}`}>
              {opt.value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Etapa 4 — Preferências de Estudo
// ============================================================
function StepStudyPrefs({
  value,
  onChange,
}: {
  value: StudyPreference;
  onChange: (v: StudyPreference) => void;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl space-y-6">

      {/* Comprimento do resumo */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Como prefere receber o conteúdo?</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: 'short', label: 'Resumos diretos', emoji: '⚡', desc: 'Só o essencial, rápido de ler' },
            { v: 'detailed', label: 'Explicações completas', emoji: '📖', desc: 'Mais contexto e profundidade' },
          ].map(({ v, label, emoji, desc }) => (
            <button
              key={v}
              onClick={() => onChange({ ...value, summaryLength: v as 'short' | 'detailed' })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                value.summaryLength === v
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <p className={`text-sm font-semibold mt-2 ${value.summaryLength === v ? 'text-indigo-800' : 'text-gray-800'}`}>{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Prefere exemplos? */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-semibold text-gray-900 mb-3">Prefere exemplos práticos do esporte?</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: true, label: 'Sim, muito!', emoji: '🏃', desc: 'Quero exemplos do esporte em tudo' },
            { v: false, label: 'Teoria primeiro', emoji: '🧠', desc: 'Prefiro conceitos antes da prática' },
          ].map(({ v, label, emoji, desc }) => (
            <button
              key={String(v)}
              onClick={() => onChange({ ...value, prefersExamples: v })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                value.prefersExamples === v
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <p className={`text-sm font-semibold mt-2 ${value.prefersExamples === v ? 'text-indigo-800' : 'text-gray-800'}`}>{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Casos reais */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-semibold text-gray-900 mb-3">Gosta de casos reais e situações concretas?</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: true, label: 'Sim, histórias reais', emoji: '📰', desc: 'Casos de atletas, lesões reais, situações de treino' },
            { v: false, label: 'Prefiro científico', emoji: '🔬', desc: 'Abordagem mais formal e técnica' },
          ].map(({ v, label, emoji, desc }) => (
            <button
              key={String(v)}
              onClick={() => onChange({ ...value, prefersRealCases: v })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                value.prefersRealCases === v
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <p className={`text-sm font-semibold mt-2 ${value.prefersRealCases === v ? 'text-indigo-800' : 'text-gray-800'}`}>{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Modo de aprendizagem */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-semibold text-gray-900 mb-3">Você aprende melhor…</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { v: 'visual', label: 'Vendo', emoji: '👁️' },
            { v: 'reading', label: 'Lendo', emoji: '📖' },
            { v: 'kinesthetic', label: 'Praticando', emoji: '🏃' },
            { v: 'auditory', label: 'Ouvindo', emoji: '👂' },
          ].map(({ v, label, emoji }) => (
            <button
              key={v}
              onClick={() => onChange({ ...value, learningMode: v })}
              className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                value.learningMode === v
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <p className={`text-sm font-semibold ${value.learningMode === v ? 'text-indigo-800' : 'text-gray-800'}`}>{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tela final — Perfil completo
// ============================================================
function StepResult({
  varkResult,
  careerGoal,
  sports,
  onEnter,
}: {
  varkResult: VarkResult;
  careerGoal: string;
  sports: string[];
  onEnter: () => void;
}) {
  const colors = VARK_STYLE_COLORS[varkResult.primaryStyle];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"
        >
          <span className="text-4xl">{VARK_STYLE_EMOJIS[varkResult.primaryStyle]}</span>
        </motion.div>
        <p className="text-indigo-300 text-sm font-medium uppercase tracking-wider mb-1">Seu Perfil</p>
        <h2 className="text-3xl font-bold text-white">
          Aprendiz{' '}
          <span className="text-indigo-300">{VARK_STYLE_LABELS[varkResult.primaryStyle]}</span>
        </h2>
        {varkResult.secondaryStyle && (
          <p className="text-indigo-300 mt-1 text-sm">
            Com traços de {VARK_STYLE_LABELS[varkResult.secondaryStyle].toLowerCase()}
          </p>
        )}
      </div>

      {/* Card de resumo */}
      <div className="bg-white rounded-2xl p-5 shadow-xl space-y-4">
        {/* VARK scores */}
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(varkResult.scores).map(([style, score]) => {
            const sc = VARK_STYLE_COLORS[style];
            const max = Math.max(...Object.values(varkResult.scores));
            return (
              <div key={style} className={`p-2 rounded-xl ${sc.bg} ${sc.border} border text-center`}>
                <p className={`text-xs font-medium ${sc.text}`}>{VARK_STYLE_EMOJIS[style]}</p>
                <p className={`text-lg font-bold ${sc.text}`}>{score}</p>
                <p className={`text-xs ${sc.text} opacity-70`}>{VARK_STYLE_LABELS[style].split('/')[0]}</p>
                <div className="h-1 bg-white/50 rounded-full overflow-hidden mt-1">
                  <div className={`h-full rounded-full bg-gradient-to-r ${sc.gradient}`} style={{ width: `${max > 0 ? (score / max) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Perfil profissional */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-xs text-gray-400">Objetivo profissional</p>
            <p className="text-sm font-semibold text-gray-900">{careerGoal}</p>
          </div>
        </div>

        {/* Esportes */}
        {sports.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-2">Contexto esportivo</p>
            <div className="flex flex-wrap gap-1.5">
              {sports.slice(0, 6).map((s) => (
                <span key={s} className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Descrição */}
        <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
          <p className={`text-xs leading-relaxed ${colors.text}`}>{varkResult.description}</p>
        </div>

        <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 leading-relaxed">
            A plataforma vai preparar automaticamente resumos, flashcards e revisões
            adaptados ao seu perfil — você não precisa pedir nada.
          </p>
        </div>
      </div>

      <button
        onClick={onEnter}
        className="w-full bg-white text-indigo-700 font-bold py-4 rounded-2xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
      >
        Acessar meu espaço de estudos
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ============================================================
// Componente principal
// ============================================================

const STEPS = [
  { id: 1, label: 'Aprendizagem', icon: BookOpen, description: 'Como você aprende melhor' },
  { id: 2, label: 'Esporte', icon: Dumbbell, description: 'Suas modalidades e nível' },
  { id: 3, label: 'Carreira', icon: Target, description: 'Seu objetivo profissional' },
  { id: 4, label: 'Estudo', icon: GraduationCap, description: 'Suas preferências' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [varkAnswers, setVarkAnswers] = useState<VarkAnswer[]>([]);
  const [varkResult, setVarkResult] = useState<VarkResult | null>(null);
  const [sportsProfile, setSportsProfile] = useState<SportsProfile>({
    practiced: [],
    liked: [],
    followed: [],
    level: '',
  });
  const [careerGoal, setCareerGoal] = useState('');
  const [studyPreference, setStudyPreference] = useState<StudyPreference>({
    summaryLength: 'detailed',
    prefersExamples: true,
    prefersRealCases: true,
    learningMode: 'kinesthetic',
  });

  const submitMutation = useMutation({
    mutationFn: (payload: {
      answers: VarkAnswer[];
      sportsProfile: SportsProfile;
      careerGoal: string;
      studyPreference: StudyPreference;
    }) => varkService.submitOnboarding(payload),
    onSuccess: (data) => {
      setVarkResult(data);
      setStep(5); // tela de resultado
    },
    onError: () => {
      toast.error('Erro ao salvar perfil. Tente novamente.');
    },
  });

  async function handleFinish() {
    await refreshUser();
    navigate('/dashboard');
  }

  function handleVarkComplete(answers: VarkAnswer[]) {
    setVarkAnswers(answers);
    setStep(2);
  }

  function handleNext() {
    if (step === 4) {
      submitMutation.mutate({ answers: varkAnswers, sportsProfile, careerGoal, studyPreference });
    } else {
      setStep(step + 1);
    }
  }

  function canProceed(): boolean {
    if (step === 2) return sportsProfile.level !== '';
    if (step === 3) return careerGoal !== '';
    return true;
  }

  // Tela de resultado
  if (step === 5 && varkResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <StepResult
            varkResult={varkResult}
            careerGoal={careerGoal}
            sports={[...sportsProfile.practiced, ...sportsProfile.liked].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5)}
            onEnter={handleFinish}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Configurando seu perfil de aprendizagem</h1>
          </div>
          <p className="text-indigo-300 text-sm">A plataforma vai se adaptar completamente a você</p>
        </motion.div>

        {/* Indicadores de etapa */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                step === s.id
                  ? 'bg-white text-indigo-700 font-semibold'
                  : step > s.id
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-indigo-400'
              }`}>
                {step > s.id ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <s.icon className="w-3.5 h-3.5" />
                )}
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 rounded-full ${step > s.id ? 'bg-white/40' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Conteúdo da etapa */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <StepVark answers={varkAnswers} onComplete={handleVarkComplete} />
            )}

            {step === 2 && (
              <>
                <StepSports value={sportsProfile} onChange={setSportsProfile} />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button onClick={handleNext} disabled={!canProceed()}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                      canProceed() ? 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg' : 'bg-white/20 text-white/40 cursor-not-allowed'
                    }`}>
                    Próxima etapa <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-lg font-bold text-white mb-4">Qual área você quer seguir?</h2>
                <StepCareer value={careerGoal} onChange={setCareerGoal} />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button onClick={handleNext} disabled={!canProceed()}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                      canProceed() ? 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg' : 'bg-white/20 text-white/40 cursor-not-allowed'
                    }`}>
                    Próxima etapa <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="text-lg font-bold text-white mb-4">Como você prefere estudar?</h2>
                <StepStudyPrefs value={studyPreference} onChange={setStudyPreference} />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setStep(3)}
                    className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={submitMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg transition-all"
                  >
                    {submitMutation.isPending ? (
                      <><div className="w-5 h-5 border-2 border-indigo-400 border-t-indigo-700 rounded-full animate-spin" /> Salvando...</>
                    ) : (
                      <>Concluir configuração <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
