/**
 * Configuração central da aplicação
 * Todas as variáveis de ambiente são lidas e validadas aqui
 */
import dotenv from 'dotenv';
dotenv.config();

// Helper para garantir que variáveis obrigatórias estão presentes
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Variável de ambiente obrigatória não definida: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue = ''): string {
  return process.env[key] || defaultValue;
}

export const config = {
  // Servidor
  port: parseInt(optionalEnv('PORT', '3000')),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isDevelopment: optionalEnv('NODE_ENV', 'development') === 'development',

  // URLs
  frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:3001'),

  // JWT
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '7d'),
  },

  // Google OAuth
  google: {
    clientId: requireEnv('GOOGLE_CLIENT_ID'),
    clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
    callbackUrl: optionalEnv('GOOGLE_CALLBACK_URL', 'http://localhost:3000/api/auth/google/callback'),
    // Escopos necessários para acessar Classroom e Drive
    // IMPORTANTE: devem bater exatamente com os escopos habilitados no Google Cloud Console
    // classroom.coursework.me.readonly REMOVIDO — causa bloqueio no Testing Mode
    scopes: [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
      'https://www.googleapis.com/auth/classroom.announcements.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  },

  // IA — OpenAI direto (MVP)
  // OPENAI_API_KEY é opcional no startup para não bloquear o fluxo OAuth
  // Mas será exigida quando rotas de IA forem chamadas
  ai: {
    openai: {
      apiKey: optionalEnv('OPENAI_API_KEY', ''),
      model: optionalEnv('OPENAI_MODEL', 'gpt-4o-mini'),
    },
  },
} as const;
