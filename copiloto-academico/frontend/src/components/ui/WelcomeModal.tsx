import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, GraduationCap, RefreshCw, UserCheck,
  BookOpen, Brain, Archive,
} from 'lucide-react';
import { useTutorial } from '../../context/TutorialContext';
import { useAuth } from '../../context/AuthContext';

const STEPS = [
  {
    icon: RefreshCw,
    color: 'bg-indigo-100 text-indigo-600',
    title: 'Conecte e sincronize',
    description: 'Clique em "Atualizar Classroom" para importar automaticamente suas disciplinas e materiais.',
  },
  {
    icon: UserCheck,
    color: 'bg-purple-100 text-purple-600',
    title: 'Configure seu perfil',
    description: 'Responda o questionário de aprendizagem e informe seus esportes e objetivos profissionais.',
  },
  {
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-600',
    title: 'Acesse uma disciplina',
    description: 'Ao abrir uma disciplina, o sistema prepara automaticamente o material adaptado ao seu perfil.',
  },
  {
    icon: Brain,
    color: 'bg-emerald-100 text-emerald-600',
    title: 'Estude de forma adaptada',
    description: 'Resumos, flashcards e exemplos práticos conectados ao seu esporte e objetivo de carreira.',
  },
  {
    icon: Archive,
    color: 'bg-amber-100 text-amber-600',
    title: 'Continue de onde parou',
    description: 'Tudo é salvo automaticamente. Não é necessário preparar o mesmo material duas vezes.',
  },
];

export default function WelcomeModal() {
  const { isOpen, closeTutorial } = useTutorial();
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleStart() {
    closeTutorial();
    if (user && !user.varkCompleted) {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={closeTutorial}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-indigo-600 to-purple-600 px-8 pt-8 pb-6 text-white">
                <button
                  onClick={closeTutorial}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>

                <h2 className="text-xl font-bold leading-snug">
                  Bem-vindo à sua plataforma de aprendizagem personalizada
                </h2>
                <p className="text-sm text-white/80 mt-2 leading-relaxed">
                  Seus materiais do Google Classroom são organizados e preparados conforme seu
                  perfil, seus esportes de interesse e seus objetivos profissionais.
                </p>
              </div>

              {/* Steps */}
              <div className="px-8 py-6 space-y-4">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      className="flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 relative">
                        <Icon className={`w-4 h-4 ${step.color.split(' ')[1]}`} />
                        <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-8 pb-7 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleStart}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200"
                >
                  Começar agora
                </button>
                <button
                  onClick={closeTutorial}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 active:scale-95 transition-all"
                >
                  Ver depois
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
