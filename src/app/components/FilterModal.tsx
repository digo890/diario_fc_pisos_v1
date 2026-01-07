import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search } from 'lucide-react';

type ObraFilter = 'todas' | 'novo' | 'em_andamento' | 'conferencia' | 'concluidas';
type UserFilter = 'todos' | 'Encarregado' | 'Administrador';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'obras' | 'usuarios';
  currentFilter: ObraFilter | UserFilter;
  onFilterChange: (filter: ObraFilter | UserFilter) => void;
  onSearchChange?: (search: string) => void;
  searchValue?: string;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  type,
  currentFilter,
  onFilterChange,
  onSearchChange,
  searchValue = ''
}) => {
  const [localSearch, setLocalSearch] = useState(searchValue);

  // Sincronizar o state local quando searchValue mudar
  useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onSearchChange?.(value);
  };

  const handleFilterSelect = (filter: ObraFilter | UserFilter) => {
    onFilterChange(filter);
    onClose();
  };
  
  // Função para fechar o modal ao apertar Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onClose();
    }
  };
  
  // Função para limpar o campo de busca
  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange?.('');
  };

  const obraFilters: { value: ObraFilter; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'novo', label: 'Novo' },
    { value: 'em_andamento', label: 'Em andamento' },
    { value: 'conferencia', label: 'Conferência' },
    { value: 'concluidas', label: 'Concluídas' }
  ];

  const userFilters: { value: UserFilter; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'Encarregado', label: 'Encarregados' },
    { value: 'Administrador', label: 'Administradores' }
  ];

  const filters = type === 'obras' ? obraFilters : userFilters;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Filtrar {type === 'obras' ? 'Obras' : 'Usuários'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="search"
                enterKeyHint="search"
                placeholder={`Buscar ${type === 'obras' ? 'obras' : 'usuários'}...`}
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         placeholder:text-gray-500 dark:placeholder:text-gray-400
                         focus:outline-none focus:ring-2 focus:ring-[#FD5521] focus:border-transparent
                         transition-all"
              />
              <AnimatePresence>
                {localSearch && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full 
                             hover:bg-gray-200 dark:hover:bg-gray-700 
                             text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300
                             transition-colors"
                    aria-label="Limpar busca"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 pb-6 pt-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleFilterSelect(filter.value as any)}
                className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-all ${
                  currentFilter === filter.value
                    ? 'bg-[#FD5521] text-white shadow-md shadow-[#FD5521]/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{filter.label}</span>
                  {currentFilter === filter.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M10 3L4.5 8.5L2 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FilterModal;