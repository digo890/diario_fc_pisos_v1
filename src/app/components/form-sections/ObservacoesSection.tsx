import React from 'react';
import type { FormData } from '../../types';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  isReadOnly: boolean;
}

const ObservacoesSection: React.FC<Props> = ({ data, onChange, isReadOnly }) => {
  const observacoes = data.observacoes || '';
  const displayValue = isReadOnly && !observacoes ? 'Sem observações' : observacoes;

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Observações Gerais
      </h2>

      <textarea
        value={displayValue}
        onChange={(e) => onChange({ observacoes: e.target.value })}
        disabled={isReadOnly}
        placeholder={isReadOnly ? '' : 'Adicione observações gerais sobre o trabalho executado, condições especiais, ocorrências ou qualquer informação relevante...'}
        rows={6}
        className="w-full px-4 py-3 rounded-xl 
                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                 placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500
                 resize-none"
      />
    </section>
  );
};

export default ObservacoesSection;