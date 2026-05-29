/**
 * Página de Configurações — MVP
 */
import { Settings, CheckCircle, Brain, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTutorial } from '../context/TutorialContext';
import { VARK_STYLE_LABELS, VARK_STYLE_EMOJIS, VARK_STYLE_COLORS } from '../data/varkQuestions';

export default function SettingsPage() {
  const { user } = useAuth();
  const { openTutorial } = useTutorial();
  const profile = user?.learningProfile;
  const primaryColors = profile ? VARK_STYLE_COLORS[profile.primaryStyle] : null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Sua conta e perfil de aprendizagem</p>
      </div>

      {/* Perfil */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
          Conta Google
        </h3>
        {user && (
          <div className="flex items-center gap-4">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-14 h-14 rounded-full border-2 border-gray-100" />
            ) : (
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-700 text-xl font-bold">{user.name.charAt(0)}</span>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{user.name}</p>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Google Classroom conectado
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Perfil VARK */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-500" />
          Perfil de Aprendizagem VARK
        </h3>

        {profile && primaryColors ? (
          <div className={`rounded-xl p-4 ${primaryColors.bg} ${primaryColors.border} border`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{VARK_STYLE_EMOJIS[profile.primaryStyle]}</span>
              <div>
                <p className={`font-bold text-lg ${primaryColors.text}`}>
                  Aprendiz {VARK_STYLE_LABELS[profile.primaryStyle]}
                </p>
                {profile.secondaryStyle && (
                  <p className={`text-sm ${primaryColors.text} opacity-70`}>
                    Com traços de {VARK_STYLE_LABELS[profile.secondaryStyle].toLowerCase()}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: VARK_STYLE_LABELS.visual, key: 'visual', score: profile.visualScore },
                { label: VARK_STYLE_LABELS.auditory, key: 'auditory', score: profile.auditoryScore },
                { label: VARK_STYLE_LABELS.reading, key: 'reading', score: profile.readingScore },
                { label: VARK_STYLE_LABELS.kinesthetic, key: 'kinesthetic', score: profile.kinestheticScore },
              ].map(({ label, key, score }) => {
                const colors = VARK_STYLE_COLORS[key];
                return (
                  <div key={key} className="text-center">
                    <p className={`text-lg font-bold ${primaryColors.text}`}>{score}</p>
                    <p className={`text-xs ${primaryColors.text} opacity-70`}>{label}</p>
                  </div>
                );
              })}
            </div>

            <Link
              to="/onboarding"
              className={`text-sm font-medium ${primaryColors.text} underline`}
            >
              Refazer perfil completo
            </Link>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 mb-3">Você ainda não configurou seu perfil de aprendizagem</p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              <Brain className="w-4 h-4" />
              Configurar perfil
            </Link>
          </div>
        )}
      </section>

      {/* Motor de personalização — sem expor detalhes técnicos de IA */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Motor de Personalização</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-600">Processamento</span>
            <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
              <CheckCircle className="w-3.5 h-3.5" /> Ativo
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-600">Adaptação ao perfil VARK</span>
            <span className="text-sm font-medium text-emerald-600">✓ Configurado</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
            <span className="text-sm text-gray-600">Contexto esportivo</span>
            <span className="text-sm font-medium text-emerald-600">✓ Educação Física</span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-gray-600">Preparação de conteúdo</span>
            <span className="text-sm font-medium text-gray-900">Ao acessar a disciplina</span>
          </div>
        </div>
      </section>

      {/* Tutorial */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-indigo-500" />
          Tutorial da plataforma
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Relembre como a plataforma funciona e quais são os primeiros passos.
        </p>
        <button
          onClick={openTutorial}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
        >
          <PlayCircle className="w-4 h-4" />
          Ver tutorial novamente
        </button>
      </section>
    </div>
  );
}
