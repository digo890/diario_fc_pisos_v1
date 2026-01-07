import { useState, useEffect } from 'react';

/**
 * 🚀 PERFORMANCE: Hook de debouncing
 * 
 * Evita execuções excessivas de funções custosas durante digitação
 * Útil para buscas, filtros e validações em tempo real
 * 
 * @param value Valor a ser debounced
 * @param delay Delay em milissegundos (padrão: 300ms)
 * @returns Valor debounced
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // Só executa após 500ms sem digitação
 *   performSearch(debouncedSearch);
 * }, [debouncedSearch]);
 */

export const useDebounce = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Criar timeout para atualizar o valor após o delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpar timeout se o valor mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook alternativo que retorna também o estado de "is debouncing"
 * Útil para mostrar indicador de carregamento
 */
export const useDebounceWithStatus = <T,>(value: T, delay: number = 300) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);

    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return { debouncedValue, isDebouncing };
};
