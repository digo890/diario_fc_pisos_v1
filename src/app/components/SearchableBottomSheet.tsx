import React, { useEffect, useState } from 'react';
import { X, Search } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  sublabel?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: Option[];
  selectedId?: string;
  onSelect: (id: string) => void;
  searchPlaceholder?: string;
}

const SearchableBottomSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  options,
  selectedId,
  onSelect,
  searchPlaceholder = "Buscar..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSearchTerm(''); // Limpar busca ao abrir
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtrar opções baseado no termo de busca
  const filteredOptions = options.filter(option => {
    const searchLower = searchTerm.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchLower) ||
      (option.sublabel && option.sublabel.toLowerCase().includes(searchLower))
    );
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-900 rounded-[20px] shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl 
                         bg-white dark:bg-gray-800 
                         border border-gray-200 dark:border-gray-700
                         text-gray-900 dark:text-white
                         placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                         focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40 focus:border-transparent
                         transition-shadow"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      Nenhum resultado encontrado
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Tente buscar com outros termos
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2 px-4">
                {filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onSelect(option.id);
                      onClose();
                    }}
                    className={`w-full px-4 py-4 flex items-center justify-between transition-colors rounded-xl mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FD5521]/40 ${
                      selectedId === option.id 
                        ? 'bg-[#FD5521]/10' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex-1 text-left">
                      <div className={`font-medium ${
                        selectedId === option.id 
                          ? 'text-[#FD5521]' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {option.label}
                      </div>
                      {option.sublabel && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {option.sublabel}
                        </div>
                      )}
                    </div>
                    {selectedId === option.id && (
                      <div className="w-5 h-5 rounded-full bg-[#FD5521] flex items-center justify-center ml-3 flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer com contador */}
          {searchTerm && filteredOptions.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                {filteredOptions.length} {filteredOptions.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchableBottomSheet;