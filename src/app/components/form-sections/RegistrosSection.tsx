import React, { useRef, useState } from 'react';
import { Camera, X, ChevronDown, Trash2 } from 'lucide-react';
import type { FormData, CondicionalItem } from '../../types';

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
  isReadOnly: boolean;
  activeServico: 'servico1' | 'servico2' | 'servico3'; // Novo parâmetro
}

const REGISTROS_ITEMS = [
  'Constatou-se água / umidade no substrato?',
  'As áreas estavam com fechamento lateral?',
  'Estado do substrato',
  'Existe contaminações / crostas / incrustações no substrato?',
  'Há concreto remontado sobre os bordos de ralos / canaletas / trilhos (ml)?',
  'Há ralos / canaletas / trilhos desnivelados em relação ao substrato (ml)?',
  'O boleado de rodapés / muretas foi executado com concreto?',
  'Qual a espessura do piso de concreto?',
  'Qual a profundidade dos cortes das juntas serradas?',
  'As juntas serradas do piso foram aprofundadas por corte adicional? Em que extensão (ml)?',
  'Existem juntas de dilatação no substrato (ml)?',
  'As muretas estão ancoradas no piso?',
  'Existem muretas apoiadas sobre juntas de dilatação no piso?',
  'Existem juntas com bordas esborcinadas (ml)?',
  'Existem trincas no substrato (ml)?',
  'Existem serviços adicionais a serem realizados?',
  'Os serviços adicionais foram liberados pela contratante?',
  'O preposto acompanhou e conferiu as medições?',
  'As áreas concluídas foram protegidas e isoladas?',
  'O substrato foi fotografado?',
  'Ocorreu alguma desconformidade durante ou após as aplicações?',
  'Você relatou ao preposto as desconformidades?'
];

const ESTADO_SUBSTRATO_OPTIONS = ['Fraco', 'Irregular / Ondulado', 'Bom Estado'];

const RegistrosSection: React.FC<Props> = ({ data, onChange, isReadOnly, activeServico }) => {
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [showSubstratoSheet, setShowSubstratoSheet] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ key: string; src: string } | null>(null);

  // Pegar os registros do serviço ativo
  const servico = data.servicos[activeServico];
  const registros = servico?.registros || {};

  const updateRegistro = (key: string, updates: Partial<CondicionalItem>) => {
    const currentServico = data.servicos[activeServico] || {
      horario: '',
      local: '',
      etapas: {},
      registros: {}
    };

    onChange({
      servicos: {
        ...data.servicos,
        [activeServico]: {
          ...currentServico,
          registros: {
            ...currentServico.registros,
            [key]: {
              ...currentServico.registros?.[key],
              ...updates
            }
          }
        }
      }
    });
  };

  const toggleRegistro = (key: string) => {
    const item = registros[key];
    if (item?.ativo) {
      // Desativar
      const currentServico = data.servicos[activeServico] || {
        horario: '',
        local: '',
        etapas: {},
        registros: {}
      };
      
      const newRegistros = { ...currentServico.registros };
      delete newRegistros[key];
      
      onChange({
        servicos: {
          ...data.servicos,
          [activeServico]: {
            ...currentServico,
            registros: newRegistros
          }
        }
      });
    } else {
      // Ativar
      updateRegistro(key, { ativo: true, texto: '', foto: undefined });
    }
  };

  const handleFotoChange = async (key: string, file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateRegistro(key, { foto: reader.result as string });
      setImagePreview({ key, src: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeFoto = (key: string) => {
    updateRegistro(key, { foto: undefined });
    setImagePreview(null);
  };

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
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                {title}
              </h3>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto flex-1 py-2">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onSelect(option);
                    onClose();
                  }}
                  className={`w-full px-6 py-4 flex items-center justify-between transition-colors rounded-xl mx-2 mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FD5521]/40 ${
                    value === option ? 'bg-[#FD5521]/10' : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className={`font-medium ${
                    value === option 
                      ? 'text-[#FD5521]' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {option}
                  </div>
                  {value === option && (
                    <div className="w-5 h-5 rounded-full bg-[#FD5521] flex items-center justify-center ml-3">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Estado do Substrato
      </h2>

      <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden">
        {REGISTROS_ITEMS.map((label, index) => {
          const key = `registro-${index}`;
          const item = registros[key];
          const isAtivo = item?.ativo || false;
          const isEstadoSubstrato = index === 2; // Item 40
          const isNumericField45 = index === 7; // Item 45 - Campo numérico simples
          const isNumericField46 = index === 8; // Item 46 - Campo numérico com observação
          const isEven = index % 2 === 0; // Para cores alternadas

          return (
            <div 
              key={key}
              className={isEven ? 'bg-white dark:bg-gray-900' : 'bg-[#F9FAF2] dark:bg-gray-800'}
            >
              <div 
                className="p-4"
                style={{ 
                  boxShadow: index === 21 
                    ? 'inset 4px 0 0 white, inset -4px 0 0 white, inset 0 -4px 0 white' 
                    : 'inset 4px 0 0 white, inset -4px 0 0 white'
                }}
              >
                {/* Item 40: Estado do Substrato - Dropdown */}
                {isEstadoSubstrato ? (
                  <div>
                    <label className="block font-medium text-gray-900 dark:text-white mb-3">
                      <span className="text-[#C6CCC2] dark:text-[#C6CCC2]">{39 + index}.</span> {label}
                    </label>
                    <button
                      type="button"
                      onClick={() => !isReadOnly && setShowSubstratoSheet(true)}
                      disabled={isReadOnly}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700
                               bg-white dark:bg-gray-800 text-left flex items-center justify-between
                               focus:ring-2 focus:ring-[#FD5521]/40 focus:border-transparent
                               hover:border-[#FD5521] disabled:hover:border-gray-300 disabled:cursor-not-allowed"
                    >
                      <span className={item?.texto ? 'text-gray-900 dark:text-white' : 'text-[#C6CCC2] dark:text-gray-600'}>
                        {item?.texto || (isReadOnly ? '' : 'Selecione')}
                      </span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>

                    {/* Campo de descrição quando uma opção é selecionada */}
                    {item?.texto && (
                      <div className="mt-3 space-y-3">
                        <textarea
                          value={item.comentario || ''}
                          onChange={(e) => updateRegistro(key, { comentario: e.target.value })}
                          disabled={isReadOnly}
                          placeholder={isReadOnly ? '' : 'Descreva detalhes sobre o estado do substrato...'}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                 focus:outline-none
                                 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500
                                 resize-none"
                        />

                        {/* Foto */}
                        {item.foto ? (
                          <img
                            src={item.foto}
                            alt="Registro"
                            className="w-[72px] h-[72px] object-cover rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setImagePreview({ key, src: item.foto! })}
                          />
                        ) : (
                          !isReadOnly && (
                            <>
                              <input
                                ref={(el) => (fileInputRefs.current[key] = el)}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => handleFotoChange(key, e.target.files?.[0] || null)}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[key]?.click()}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed 
                                         border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300
                                         hover:border-[#FD5521] hover:text-[#FD5521]"
                              >
                                <Camera className="w-4 h-4" />
                                Anexar foto
                              </button>
                            </>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ) : isNumericField45 ? (
                  // Item 45: Campo numérico simples (sem observação)
                  <div>
                    <label className="block font-medium text-gray-900 dark:text-white mb-3">
                      <span className="text-[#C6CCC2] dark:text-[#C6CCC2]">{39 + index}.</span> {label}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={item?.texto || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Permite números, pontos, vírgulas, barras e hífens
                          if (/^[0-9.,/\\-]*$/.test(value)) {
                            updateRegistro(key, { texto: value });
                          }
                        }}
                        disabled={isReadOnly}
                        placeholder={isReadOnly ? '' : 'Digite a espessura'}
                        className="w-full px-4 py-3 pr-12 rounded-lg border-0
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                                 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none text-sm">
                        cm
                      </span>
                    </div>
                  </div>
                ) : isNumericField46 ? (
                  // Item 46: Campo numérico com observação
                  <div>
                    <label className="block font-medium text-gray-900 dark:text-white mb-3">
                      <span className="text-[#C6CCC2] dark:text-[#C6CCC2]">{39 + index}.</span> {label}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={item?.texto || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Permite números, pontos, vírgulas, barras e hífens
                          if (/^[0-9.,/\\-]*$/.test(value)) {
                            updateRegistro(key, { texto: value });
                          }
                        }}
                        disabled={isReadOnly}
                        placeholder={isReadOnly ? '' : 'Digite a profundidade'}
                        className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-700 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                                 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none text-sm">
                        cm
                      </span>
                    </div>
                    
                    {/* Campo de observação sempre visível */}
                    <textarea
                      value={item?.comentario || ''}
                      onChange={(e) => updateRegistro(key, { comentario: e.target.value })}
                      disabled={isReadOnly}
                      placeholder={isReadOnly ? '' : 'Observações adicionais...'}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                               disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500
                               resize-none mt-3"
                    />
                  </div>
                ) : (
                  // Demais itens: Toggle Sim/Não
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1">
                        <label className="font-medium text-gray-900 dark:text-white">
                          <span className="text-[#C6CCC2] dark:text-[#C6CCC2]">{39 + index}.</span> {label}
                        </label>
                      </div>
                      
                      {/* Switch Não/Sim - Design tipo toggle */}
                      <div className="bg-[#edefe3] dark:bg-gray-800 rounded-full p-1 relative w-full sm:w-auto">
                        {/* Background verde que desliza */}
                        <div 
                          className={`absolute top-1 bottom-1 left-1 right-1 w-[calc(50%-4px)] bg-[#DBEA8D] dark:bg-[#DBEA8D] rounded-full transition-transform duration-300 ease-in-out ${
                            isAtivo ? 'translate-x-full' : 'translate-x-0'
                          }`}
                        />
                        
                        {/* Botões de texto */}
                        <div className="relative flex">
                          <button
                            type="button"
                            onClick={() => !isReadOnly && isAtivo && toggleRegistro(key)}
                            disabled={isReadOnly}
                            className={`w-1/2 px-5 py-2.5 rounded-full text-xs font-bold transition-opacity duration-300 disabled:cursor-not-allowed z-10 ${
                              !isAtivo
                                ? 'text-black opacity-100'
                                : 'text-black dark:text-gray-400 opacity-40'
                            }`}
                          >
                            Não
                          </button>
                          <button
                            type="button"
                            onClick={() => !isReadOnly && !isAtivo && toggleRegistro(key)}
                            disabled={isReadOnly}
                            className={`w-1/2 px-5 py-2.5 rounded-full text-xs font-bold transition-opacity duration-300 disabled:cursor-not-allowed z-10 ${
                              isAtivo
                                ? 'text-black opacity-100'
                                : 'text-black dark:text-gray-400 opacity-40'
                            }`}
                          >
                            Sim
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Campo de texto e foto (quando Sim) */}
                    {isAtivo && (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={item.texto}
                          onChange={(e) => updateRegistro(key, { texto: e.target.value })}
                          disabled={isReadOnly}
                          placeholder={isReadOnly ? '' : 'Descreva detalhes sobre este registro...'}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl 
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                   focus:outline-none
                                   disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500
                                   resize-none"
                        />

                        {/* Foto */}
                        {item.foto ? (
                          <img
                            src={item.foto}
                            alt="Registro"
                            className="w-[72px] h-[72px] object-cover rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setImagePreview({ key, src: item.foto! })}
                          />
                        ) : (
                          !isReadOnly && (
                            <>
                              <input
                                ref={(el) => (fileInputRefs.current[key] = el)}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => handleFotoChange(key, e.target.files?.[0] || null)}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[key]?.click()}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed 
                                         border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300
                                         hover:border-[#FD5521] hover:text-[#FD5521]"
                              >
                                <Camera className="w-4 h-4" />
                                Anexar foto
                              </button>
                            </>
                          )
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sheet para Estado do Substrato */}
      <BottomSheet
        isOpen={showSubstratoSheet}
        onClose={() => setShowSubstratoSheet(false)}
        options={ESTADO_SUBSTRATO_OPTIONS}
        value={registros['registro-2']?.texto || ''}
        onSelect={(value) => updateRegistro('registro-2', { texto: value })}
        title="Selecione o estado do substrato"
      />

      {/* Modal de Preview de Imagem */}
      {imagePreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setImagePreview(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            {/* Botão Fechar */}
            <button
              onClick={() => setImagePreview(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-900/80 text-white hover:bg-gray-800 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Botão Excluir */}
            {!isReadOnly && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFoto(imagePreview.key);
                }}
                className="absolute top-4 left-4 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors z-10 flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                <span className="pr-2">Excluir</span>
              </button>
            )}

            {/* Imagem */}
            <img
              src={imagePreview.src}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default RegistrosSection;