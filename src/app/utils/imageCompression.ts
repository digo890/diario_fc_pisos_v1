/**
 * 📸 Compressão de Imagens
 * Reduz o tamanho de imagens antes de enviar ao backend
 */

import imageCompression from 'browser-image-compression';

const DEFAULT_OPTIONS = {
  maxSizeMB: 1,          // Tamanho máximo: 1MB
  maxWidthOrHeight: 1920, // Resolução máxima
  useWebWorker: true,     // Usar Web Worker para não bloquear UI
};

/**
 * Converte File para Base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
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
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    const compressedFile = await imageCompression(file, opts);
    
    // Converter para Base64
    const base64 = await fileToBase64(compressedFile);
    
    return base64;
  } catch (error) {
    console.error('❌ Erro ao comprimir imagem:', error);
    // Fallback: retornar imagem original sem compressão
    return fileToBase64(file);
  }
}