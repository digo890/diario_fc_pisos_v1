import type { FormData } from '../types';
import type { Obra, FormStatus } from '../types';

/**
 * Conta obras concluídas (apenas status 'concluido')
 * ✅ Função padronizada para contar apenas obras com status 'concluido'
 * 
 * @param obras Array de obras
 * @returns Quantidade de obras concluídas
 */
export function contarObrasConcluidas(obras: Obra[]): number {
  return obras.filter(o => o.status === 'concluido').length;
}

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

/**
 * 🎯 REGRA DE DOMÍNIO: Calcula status real da obra baseado no formulário
 * 
 * Se o preposto assinou, a obra está concluída - independente do cache da obra.
 * Isso resolve dessincronização entre entidades (obra vs formulário).
 * 
 * @param obra Obra com status possivelmente desatualizado
 * @param formulario Formulário associado (opcional)
 * @returns Status real da obra
 */
export function getObraStatusReal(obra: Obra, formulario?: FormData | null): FormStatus {
  // ✅ REGRA #1: Se formulário tem assinatura do preposto → obra concluída
  if (formulario?.prepostoConfirmado === true) {
    // Se foi aprovado → concluído
    if (formulario.statusPreposto === 'aprovado') {
      return 'concluido';
    }
    // Se foi reprovado → reprovado_preposto
    if (formulario.statusPreposto === 'reprovado') {
      return 'reprovado_preposto';
    }
  }
  
  // ✅ REGRA #2: Senão, usar status da obra (fonte: backend ou cache)
  return obra.status;
}

/**
 * 🎯 Wrapper que aplica regra de domínio antes de exibir status
 * 
 * @param obra Obra
 * @param formulario Formulário associado (opcional)
 * @returns Label e cor do status REAL
 */
export function getStatusDisplayWithFormulario(
  obra: Obra,
  formulario?: FormData | null
): { label: string; color: string } {
  // Calcular status real aplicando regra de domínio
  const statusReal = getObraStatusReal(obra, formulario);
  
  // Criar obra temporária com status real
  const obraComStatusReal: Obra = { ...obra, status: statusReal };
  
  // Retornar display do status real
  return getStatusDisplay(obraComStatusReal);
}