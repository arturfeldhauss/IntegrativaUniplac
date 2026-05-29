/**
 * Serviço de integração com o Google Drive API
 *
 * Documentação oficial: https://developers.google.com/drive/api/reference/rest/v3
 *
 * Responsável por:
 * - Buscar metadados de arquivos do Drive
 * - Fazer download do conteúdo de arquivos (para processamento com IA)
 * - Identificar o tipo de arquivo (PDF, Doc, Slides, etc.)
 */
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger';

// Mapeamento de MIME types para tipos legíveis
export const MIME_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.google-apps.document': 'Google Docs',
  'application/vnd.google-apps.spreadsheet': 'Google Sheets',
  'application/vnd.google-apps.presentation': 'Google Slides',
  'application/vnd.google-apps.form': 'Google Forms',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'text/plain': 'Texto',
  'image/jpeg': 'Imagem',
  'image/png': 'Imagem',
  'video/mp4': 'Vídeo',
};

export interface DriveFileMetadata {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
  modifiedTime?: string;
  typeLabel: string;
}

/**
 * Cria uma instância do cliente Drive para um usuário específico
 */
function createDriveClient(auth: OAuth2Client): drive_v3.Drive {
  return google.drive({ version: 'v3', auth });
}

/**
 * Busca os metadados de um arquivo do Drive pelo ID
 */
export async function getFileMetadata(
  auth: OAuth2Client,
  fileId: string
): Promise<DriveFileMetadata | null> {
  const drive = createDriveClient(auth);

  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id,name,mimeType,webViewLink,size,modifiedTime',
    });

    const file = response.data;
    const mimeType = file.mimeType || '';

    return {
      id: file.id || fileId,
      name: file.name || 'Arquivo sem nome',
      mimeType,
      webViewLink: file.webViewLink || undefined,
      size: file.size || undefined,
      modifiedTime: file.modifiedTime || undefined,
      typeLabel: MIME_TYPE_LABELS[mimeType] || 'Arquivo',
    };
  } catch (error) {
    logger.warn(`Não foi possível buscar metadados do arquivo ${fileId}`, { error });
    return null;
  }
}

/**
 * Exporta um Google Doc/Slides/Sheets como texto plano
 * Usado para processar o conteúdo com IA
 */
export async function exportFileAsText(
  auth: OAuth2Client,
  fileId: string,
  mimeType: string
): Promise<string | null> {
  const drive = createDriveClient(auth);

  // Determina o formato de exportação baseado no tipo do arquivo
  const exportMimeType = getExportMimeType(mimeType);
  if (!exportMimeType) {
    logger.debug(`Arquivo ${fileId} do tipo ${mimeType} não suporta exportação como texto`);
    return null;
  }

  try {
    const response = await drive.files.export(
      { fileId, mimeType: exportMimeType },
      { responseType: 'text' }
    );

    const content = response.data as string;
    // Limita o conteúdo para não exceder o limite de tokens da IA
    return content.slice(0, 15000);
  } catch (error) {
    logger.warn(`Não foi possível exportar arquivo ${fileId}`, { error });
    return null;
  }
}

/**
 * Determina o MIME type de exportação para arquivos Google Workspace
 */
function getExportMimeType(mimeType: string): string | null {
  const exportFormats: Record<string, string> = {
    'application/vnd.google-apps.document': 'text/plain',
    'application/vnd.google-apps.spreadsheet': 'text/csv',
    'application/vnd.google-apps.presentation': 'text/plain',
  };

  return exportFormats[mimeType] || null;
}

/**
 * Verifica se o tipo de arquivo pode ter seu conteúdo extraído para IA
 */
export function canExtractContent(mimeType: string): boolean {
  const extractableTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
    'text/plain',
  ];
  return extractableTypes.includes(mimeType);
}

/**
 * Retorna o ícone/emoji para um tipo de arquivo
 */
export function getFileTypeIcon(mimeType: string): string {
  const icons: Record<string, string> = {
    'application/pdf': '📄',
    'application/vnd.google-apps.document': '📝',
    'application/vnd.google-apps.spreadsheet': '📊',
    'application/vnd.google-apps.presentation': '📊',
    'application/vnd.google-apps.form': '📋',
    'image/jpeg': '🖼️',
    'image/png': '🖼️',
    'video/mp4': '🎬',
  };

  return icons[mimeType] || '📎';
}
