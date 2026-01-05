import type { FormData } from '../types';
import type { Obra, FormStatus } from '../types';

export function generateNumeroDiario(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  
  return `${year}${month}${day}-${random}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Retorna o label e cor do status de uma obra de forma consistente
 * Baseado no status do fluxo de trabalho
 */
export function getStatusDisplay(obra: Obra): {
  label: string;
  color: string;
} {
  // Status do fluxo de trabalho
  switch (obra.status) {
    case 'novo':
      return {
        label: 'Novo',
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      };
    
    case 'em_preenchimento':
      return {
        label: 'Em andamento',
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      };
    
    case 'enviado_preposto':
      return {
        label: 'Aguardando conferência',
        color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
      };
    
    case 'reprovado_preposto':
      return {
        label: 'Devolvido para revisão',
        color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
      };
    
    case 'enviado_admin':
      return {
        label: 'Validado',
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      };
    
    case 'concluido':
      return {
        label: 'Concluída',
        color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      };
    
    default:
      return {
        label: 'Novo',
        color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      };
  }
}