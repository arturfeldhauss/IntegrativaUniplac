/**
 * Configuração base do Axios e funções utilitárias de API
 */
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

// Cria uma instância do Axios com a base URL do backend
const api = axios.create({
  baseURL: import.meta.env['VITE_API_URL'] || 'http://localhost:3000/api',
  timeout: 30000, // 30 segundos (para operações de sync/IA que demoram mais)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de REQUEST — adiciona o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de RESPONSE — trata erros globais
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message: string }>) => {
    // Token expirado ou inválido — redireciona para login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Rate limit atingido
    if (error.response?.status === 429) {
      toast.error('Muitas requisições. Aguarde um momento.');
    }

    return Promise.reject(error);
  }
);

export default api;

/**
 * Extrai a mensagem de erro de uma resposta da API
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Erro na requisição';
  }
  if (error instanceof Error) return error.message;
  return 'Erro desconhecido';
}
