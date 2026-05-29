/**
 * Página de callback OAuth
 * Recebe o token da URL após o Google redirecionar de volta
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Você cancelou o acesso ao Google. Tente novamente e aceite as permissões necessárias.',
  no_code: 'Código de autorização não encontrado. Por favor, tente fazer login novamente.',
  auth_failed: 'Falha na autenticação com o Google. Verifique sua conexão e tente novamente.',
  redirect_uri_mismatch: 'Erro de configuração OAuth (redirect_uri_mismatch). Contate o suporte.',
  invalid_token: 'Token inválido ou expirado. Por favor, faça login novamente.',
  api_not_enabled: 'As APIs do Google Classroom não estão habilitadas. Ative-as no Google Cloud Console.',
  insufficient_scope: 'Permissões insuficientes. Faça login novamente e aceite todos os escopos solicitados.',
};

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorCode = searchParams.get('error');

    if (errorCode) {
      setError(ERROR_MESSAGES[errorCode] || 'Erro desconhecido na autenticação.');
      return;
    }

    if (!token) {
      setError('Token não encontrado na resposta do servidor.');
      return;
    }

    // Faz login com o token recebido
    login(token)
      .then(() => {
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        setError('Não foi possível verificar seu login. Tente novamente.');
      });
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Falha no Login</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-600 font-medium">Autenticando...</p>
      <p className="text-gray-400 text-sm">Aguarde, estamos verificando seu acesso</p>
    </div>
  );
}
