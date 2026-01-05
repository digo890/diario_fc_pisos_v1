import React from 'react';
import { Send } from 'lucide-react';
import { Switch } from '../ui/switch';
import type { FormData } from '../../types';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

const PrepostoCheckSection: React.FC<Props> = ({ data, onChange, onSubmit, isSubmitting }) => {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl p-6">
      <div className="space-y-6">
        {/* Título */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Confirmar Diário de Obra
        </h2>

        {/* Checkbox de confirmação */}
        <label className="flex items-start gap-3 cursor-pointer group p-4 rounded-lg 
                         bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 
                         transition-colors">
          <Switch
            checked={data.prepostoConfirmado || false}
            onCheckedChange={(checked) => onChange({ prepostoConfirmado: checked })}
            className="mt-1"
          />
          <div className="flex-1">
            <span className="font-medium text-gray-900 dark:text-white group-hover:text-[#FD5521] 
                         dark:group-hover:text-[#FD5521] transition-colors">
              Li e conferi cuidadosamente todas as informações
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              Ao marcar esta opção e enviar o formulário, você está confirmando que revisou todos os dados preenchidos pelo encarregado e que as informações estão corretas e completas.
            </p>
          </div>
        </label>

        {/* Botão de envio para o administrador */}
        {onSubmit && (
          <button
            onClick={onSubmit}
            disabled={!data.prepostoConfirmado || isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg 
                     bg-[#FD5521] text-white hover:bg-[#E54A1D] 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 font-medium"
          >
            <Send className="w-5 h-5" />
            {isSubmitting ? 'Enviando...' : 'Enviar para FC Pisos'}
          </button>
        )}
      </div>
    </section>
  );
};

export default PrepostoCheckSection;