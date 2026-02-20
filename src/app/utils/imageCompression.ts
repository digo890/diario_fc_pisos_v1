/**
 * 📸 Compressão de Imagens
 * Reduz o tamanho de imagens antes de enviar ao backend
 */

import imageCompression from 'browser-image-compression';
import { safeLog, safeError } from './logSanitizer';

const DEFAULT_OPTIONS = {
  maxSizeMB: 0.6,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg',
  initialQuality: 0.85,
  alwaysKeepResolution: false,
};

/**
 * Converte File para Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Comprime imagem e retorna em Base64
 */
export async function compressImage(
  file: File,
  options?: Partial<typeof DEFAULT_OPTIONS>
): Promise<string> {
  try {
    safeLog(`📸 Comprimindo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    const opts = { ...DEFAULT_OPTIONS, ...options };

    const compressedFile = await imageCompression(file, opts);

    const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
    safeLog(
      `✅ Compressão: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB (${reduction}% redução)`
    );

    // Converter para Base64
    const base64 = await fileToBase64(compressedFile);

    return base64;
  } catch (error) {
    safeError('⚠️ Erro ao comprimir, usando original:', error);
    // Fallback: retornar imagem original sem compressão
    return fileToBase64(file);
  }
}
