/**
 * Navbar superior — título da página e sync automático
 */
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { syncService } from '../../services/sync.service';
import toast from 'react-hot-toast';

// Títulos acadêmicos — sem "IA" ou "Gerar"
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/courses': 'Minhas Disciplinas',
  '/materiais': 'Materiais de Estudo',
  '/settings': 'Configurações',
  '/onboarding': 'Configurar Perfil',
};

export default function Navbar() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const getTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/courses/')) return 'Detalhe da Disciplina';
    if (path.startsWith('/materiais/')) return 'Conteúdo de Estudo';
    return PAGE_TITLES[path] || 'Integrativa';
  };

  const syncMutation = useMutation({
    mutationFn: syncService.syncAll,
    onSuccess: (result) => {
      setSyncStatus('success');
      toast.success(
        `✅ Atualizado! ${result.coursesCount} disciplinas, ${result.materialsCount} materiais`,
        { duration: 5000 }
      );
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['course-content'] });
      setTimeout(() => setSyncStatus('idle'), 3000);
    },
    onError: (error: Error) => {
      setSyncStatus('error');
      toast.error(`Erro ao atualizar: ${error.message}`);
      setTimeout(() => setSyncStatus('idle'), 3000);
    },
  });

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{getTitle()}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Botão de atualização — linguagem neutra, sem "IA" */}
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className={`
            btn-secondary text-xs
            ${syncStatus === 'success' ? 'text-emerald-600 border-emerald-200' : ''}
            ${syncStatus === 'error' ? 'text-red-600 border-red-200' : ''}
          `}
          title="Atualizar materiais do Google Classroom"
        >
          {syncMutation.isPending ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : syncStatus === 'success' ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : syncStatus === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {syncMutation.isPending ? 'Atualizando...' : 'Atualizar Classroom'}
        </button>
      </div>
    </header>
  );
}
