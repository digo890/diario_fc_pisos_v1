import React, { useEffect } from 'react';
import { X } from 'lucide-react';

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
}

const BottomSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  options,
  selectedId,
  onSelect
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="bg-white dark:bg-gray-900 rounded-t-[20px] shadow-2xl max-h-[80vh] flex flex-col">
          {/* Handle Bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1">
            {options.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                Nenhuma opção disponível
              </div>
            ) : (
              <div className="py-2">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onSelect(option.id);
                      onClose();
                    }}
                    className={`w-full px-6 py-4 flex items-center justify-between transition-colors rounded-xl mx-2 mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FD5521]/40 ${
                      selectedId === option.id ? 'bg-[#FD5521]/10' : 'bg-white dark:bg-gray-800'
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
                      <div className="w-5 h-5 rounded-full bg-[#FD5521] flex items-center justify-center ml-3">
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
        </div>
      </div>
    </>
  );
};

export default BottomSheet;