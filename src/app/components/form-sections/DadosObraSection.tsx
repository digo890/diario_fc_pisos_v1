import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FormData } from '../../types';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  isReadOnly: boolean;
}

const URETANO_OPTIONS = ['Uretano MF', 'Uretano DP 10', 'Uretano DP 20', 'Uretano IF', 'Outro'];
const RODAPE_OPTIONS = ['Sem rodapé', '5 cm', '10 cm', '15 cm', '20 cm', 'Outro'];
const SUBSTRATO_OPTIONS = ['Fraco', 'Irregular/Ondulado', 'Bom estado'];

const DadosObraSection: React.FC<Props> = ({ data, onChange, isReadOnly }) => {
  const [showUretanoSheet, setShowUretanoSheet] = useState(false);
  const [showRodapeSheet, setShowRodapeSheet] = useState(false);
  const [showSubstratoSheet, setShowSubstratoSheet] = useState(false);

  const BottomSheet: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    options: string[];
    value: string;
    onSelect: (value: string) => void;
    title: string;
  }> = ({ isOpen, onClose, options, value, onSelect, title }) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-end"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-t-xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <div className="p-4">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSelect(option);
                  onClose();
                }}
                className={`w-full text-left px-4 py-3 rounded-xl mb-2 transition-colors ${
                  value === option
                    ? 'bg-[#FD5521]/10 text-[#FD5521] font-medium'
                    : 'bg-[#F9FAF2] dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section>
      {/* Bottom Sheets */}
      <BottomSheet
        isOpen={showUretanoSheet}
        onClose={() => setShowUretanoSheet(false)}
        options={URETANO_OPTIONS}
        value={data.ucrete}
        onSelect={(value) => onChange({ ucrete: value })}
        title="Selecione o tipo de Uretano"
      />

      <BottomSheet
        isOpen={showRodapeSheet}
        onClose={() => setShowRodapeSheet(false)}
        options={RODAPE_OPTIONS}
        value={data.rodape}
        onSelect={(value) => onChange({ rodape: value })}
        title="Selecione o rodapé"
      />

      <BottomSheet
        isOpen={showSubstratoSheet}
        onClose={() => setShowSubstratoSheet(false)}
        options={SUBSTRATO_OPTIONS}
        value={data.estadoSubstrato}
        onSelect={(value) => onChange({ estadoSubstrato: value })}
        title="Selecione o estado do substrato"
      />
    </section>
  );
};

export default DadosObraSection;