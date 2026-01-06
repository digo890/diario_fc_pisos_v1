/**
 * Utility para compressão de imagens antes de salvar no IndexedDB
 * Reduz o tamanho das imagens mantendo qualidade adequada para visualização
 */

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1, // Máximo 1MB por imagem
  maxWidthOrHeight: 1920, // Máximo 1920px de largura/altura
  useWebWorker: true,
  quality: 0.8, // 80% de qualidade
};

/**
 * Comprime uma imagem e retorna como Base64
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    console.log(`📸 Comprimindo imagem: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    const compressedFile = await imageCompression(file, opts);
    
    console.log(`✅ Imagem comprimida: ${compressedFile.name} (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Converter para Base64
    const base64 = await fileToBase64(compressedFile);
    
    return base64;
  } catch (error) {
    console.error('❌ Erro ao comprimir imagem:', error);
    // Fallback: retornar imagem original sem compressão
    return fileToBase64(file);
  }
}

/**
 * Comprime múltiplas imagens em paralelo
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<string[]> {
  const promises = files.map(file => compressImage(file, options));
  return Promise.all(promises);
}

/**
 * Converte File para Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao converter arquivo para Base64'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Calcula o tamanho aproximado de uma string Base64 em MB
 */
export function getBase64SizeMB(base64: string): number {
  // Remove o prefixo data:image/...;base64,
  const base64Data = base64.split(',')[1] || base64;
  
  // Calcula o tamanho em bytes
  const padding = (base64Data.match(/=/g) || []).length;
  const sizeInBytes = (base64Data.length * 3) / 4 - padding;
  
  // Converte para MB
  return sizeInBytes / 1024 / 1024;
}

/**
 * Verifica se a imagem precisa de compressão
 */
export function needsCompression(file: File, maxSizeMB: number = 1): boolean {
  const fileSizeMB = file.size / 1024 / 1024;
  return fileSizeMB > maxSizeMB;
}
