/**
 * Página de Login
 * Apresenta a plataforma como ambiente acadêmico inteligente.
 * Sem menções a IA — a tecnologia existe como motor invisível.
 */
import { GraduationCap, BookOpen, Zap, Target, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Sincronização Automática',
    description: 'Seus materiais do Classroom organizados e preparados automaticamente',
  },
  {
    icon: Target,
    title: 'Conteúdo Personalizado',
    description: 'Resumos, flashcards e revisões adaptados ao seu perfil e modalidade esportiva',
  },
  {
    icon: Zap,
    title: 'Tudo Pronto para Estudar',
    description: 'Material de estudo disponível sem precisar pedir — a plataforma já prepara para você',
  },
];

const HIGHLIGHTS = [
  'Perfil de aprendizagem descoberto automaticamente',
  'Conteúdo contextualizado com seu esporte',
  'Flashcards e resumos sempre disponíveis',
  'Ambiente adaptado ao seu objetivo profissional',
];

const LOGIN_ERRORS: Record<string, string> = {
  access_denied: 'Você cancelou o acesso. Tente novamente e aceite as permissões solicitadas.',
  auth_failed: 'Falha na autenticação com o Google. Tente novamente.',
  redirect_uri_mismatch: 'Erro de configuração OAuth. Contate o suporte.',
  invalid_token: 'Sessão expirada. Por favor, faça login novamente.',
  api_not_enabled: 'APIs do Google Classroom não habilitadas. Contate o suporte.',
  insufficient_scope: 'Permissões insuficientes. Tente novamente e aceite todos os escopos.',
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('error');
  const errorMessage = errorCode ? (LOGIN_ERRORS[errorCode] ?? `Erro: ${errorCode}`) : null;

  function handleGoogleLogin() {
    const base = (import.meta.env['VITE_API_URL'] || 'http://localhost:3000/api').replace(/\/api\/?$/, '');
    window.location.href = `${base}/api/auth/google`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">

        {/* Lado esquerdo — Apresentação do produto */}
        <div className="text-white space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Integrativa</h1>
              <p className="text-indigo-300 text-sm">Plataforma de Aprendizagem para Educação Física</p>
            </div>
          </div>

          {/* Headline */}
          <div>
            <h2 className="text-4xl font-bold leading-tight">
              Seu ambiente acadêmico{' '}
              <span className="text-indigo-300">já entende como você aprende</span>
            </h2>
            <p className="mt-4 text-indigo-200 text-lg leading-relaxed">
              Conecte o Google Classroom, responda algumas perguntas sobre você
              e a plataforma prepara automaticamente todo o material de estudo
              adaptado ao seu perfil e ao seu esporte.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">{feature.title}</p>
                  <p className="text-indigo-300 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Lista de destaques */}
          <div className="border-t border-white/10 pt-5">
            <ul className="grid grid-cols-2 gap-2">
              {HIGHLIGHTS.map((h) => (
                <li key={h} className="flex items-start gap-2 text-xs text-indigo-300">
                  <CheckCircle className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Lado direito — Card de login */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Bem-vindo!</h3>
            <p className="text-gray-500 mt-2 text-sm">
              Entre com sua conta Google para acessar seus materiais do Classroom
            </p>
          </div>

          {/* Erro de callback OAuth */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Botão de login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5
                       border-2 border-gray-200 rounded-xl font-semibold text-gray-700
                       hover:bg-gray-50 hover:border-gray-300 transition-all duration-150
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Entrar com Google
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>

          {/* O que acontece após login */}
          <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
            <p className="text-indigo-800 text-xs font-semibold mb-2">
              📋 O que acontece após entrar:
            </p>
            <ol className="text-indigo-700 text-xs space-y-1 list-none">
              <li>1. Suas disciplinas do Classroom são importadas</li>
              <li>2. Você responde um breve questionário sobre seu perfil</li>
              <li>3. A plataforma prepara seu material automaticamente</li>
            </ol>
            <p className="text-indigo-600 text-xs mt-2 font-medium">
              🔒 Nunca modificamos seus dados no Classroom
            </p>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade
          </p>
        </div>
      </div>
    </div>
  );
}
