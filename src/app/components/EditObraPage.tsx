import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Calendar, UserRound, Building2, MapPin, HardHat, Mail, Phone, Hash } from 'lucide-react';
import { motion } from 'motion/react';
import { saveObra } from '../utils/database';
import { obraApi } from '../utils/api';
import type { User, Obra } from '../types';
import SearchableBottomSheet from './SearchableBottomSheet';
import { useToast } from './Toast';

interface Props {
  obra: Obra;
  users: User[];
  onBack: () => void;
  onSuccess: () => void;
}

const EditObraPage: React.FC<Props> = ({ obra, users, onBack, onSuccess }) => {
  const { showToast, ToastComponent } = useToast();
  const [formData, setFormData] = useState({
    cliente: obra.cliente,
    obra: obra.obra,
    cidade: obra.cidade,
    data: obra.data,
    encarregadoId: obra.encarregadoId,
    prepostoNome: obra.prepostoNome || '',
    prepostoEmail: obra.prepostoEmail || '',
    prepostoWhatsapp: obra.prepostoWhatsapp || ''
  });

  const [errors, setErrors] = useState({
    cliente: false,
    obra: false,
    cidade: false,
    encarregadoId: false
  });

  const [isSaving, setIsSaving] = useState(false);

  const [activeSheet, setActiveSheet] = useState<'encarregado' | null>(null);

  const encarregados = users.filter(u => u.tipo === 'Encarregado');

  const selectedEncarregado = encarregados.find(e => e.id === formData.encarregadoId);

  // Função para formatar telefone brasileiro
  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é dígito
    const cleaned = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = cleaned.substring(0, 11);
    
    // Aplica a máscara
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else if (limited.length <= 10) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação dos campos
    const newErrors = {
      cliente: !formData.cliente.trim(),
      obra: !formData.obra.trim(),
      cidade: !formData.cidade.trim(),
      encarregadoId: !formData.encarregadoId
    };
    setErrors(newErrors);

    if (newErrors.cliente || newErrors.obra || newErrors.cidade || newErrors.encarregadoId) {
      return;
    }

    setIsSaving(true);

    try {
      // Atualizar obra no backend primeiro
      const response = await obraApi.update(obra.id, {
        cliente: formData.cliente,
        obra: formData.obra,
        cidade: formData.cidade,
        data: formData.data,
        encarregado_id: formData.encarregadoId,
        preposto_nome: formData.prepostoNome || undefined,
        preposto_email: formData.prepostoEmail || undefined,
        preposto_whatsapp: formData.prepostoWhatsapp || undefined
      });

      if (response.success) {
        // Atualizar também localmente (com conversão de campos)
        const obraAtualizada: Obra = {
          ...obra,
          cliente: formData.cliente,
          obra: formData.obra,
          cidade: formData.cidade,
          data: formData.data,
          encarregadoId: formData.encarregadoId,
          prepostoNome: formData.prepostoNome || undefined,
          prepostoEmail: formData.prepostoEmail || undefined,
          prepostoWhatsapp: formData.prepostoWhatsapp || undefined
        };

        await saveObra(obraAtualizada);
        showToast('Obra atualizada com sucesso!', 'success');
        
        // Aguardar um pouco para o usuário ver o toast antes de voltar
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        showToast(`Erro ao atualizar obra: ${response.error}`, 'error');
      }
    } catch (error: any) {
      console.error('❌ Erro ao atualizar obra:', error);
      showToast(`Erro ao atualizar obra: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 bg-background z-50 flex flex-col"
    >
      {/* Header */}
      <header className="bg-white dark:bg-gray-900">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Editar Obra
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#EDEFE4] dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 space-y-3">
          {/* ID da Obra */}
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#C6CCC2] pointer-events-none" />
            <input
              type="text"
              value={`#${String(obra.id).slice(-5)}`}
              disabled
              className="w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-[#DDE1D7] dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            />
          </div>

          {/* Cliente */}
          <div className="relative">
            <UserRound className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none" />
            <input
              type="text"
              value={formData.cliente}
              onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
              placeholder="Cliente *"
              className={`w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-gray-200 dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       ${errors.cliente ? 'ring-2 ring-red-500' : ''}`}
            />
            {errors.cliente && <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>}
          </div>

          {/* Obra */}
          <div className="relative">
            <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none" />
            <input
              type="text"
              value={formData.obra}
              onChange={(e) => setFormData({ ...formData, obra: e.target.value })}
              placeholder="Obra *"
              className={`w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-gray-200 dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       ${errors.obra ? 'ring-2 ring-red-500' : ''}`}
            />
            {errors.obra && <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>}
          </div>

          {/* Cidade */}
          <div className="relative">
            <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none" />
            <input
              type="text"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              placeholder="Cidade *"
              className={`w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-gray-200 dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       ${errors.cidade ? 'ring-2 ring-red-500' : ''}`}
            />
            {errors.cidade && <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>}
          </div>

          {/* Data */}
          <div className="relative">
            <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none" />
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              className="w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-gray-200 dark:border-gray-800
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40"
            />
          </div>

          {/* Encarregado - Bottom Sheet Trigger */}
          <div className="relative">
            <HardHat className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none z-10" />
            <button
              type="button"
              onClick={() => setActiveSheet('encarregado')}
              className={`w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-left flex items-center justify-between
                       border border-gray-200 dark:border-gray-800
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       ${errors.encarregadoId ? 'ring-2 ring-red-500' : ''}`}
            >
              <span className={selectedEncarregado ? 'text-gray-900 dark:text-white' : 'text-[#C6CCC2] dark:text-gray-600'}>
                {selectedEncarregado?.nome || 'Encarregado *'}
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            {errors.encarregadoId && <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>}
          </div>

          {/* Preposto - Nome */}
          <div className="relative">
            <UserRound className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none" />
            <input
              type="text"
              value={formData.prepostoNome}
              onChange={(e) => setFormData({ ...formData, prepostoNome: e.target.value })}
              placeholder="Nome do Preposto"
              className="w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-gray-200 dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40"
            />
          </div>

          {/* Preposto - Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none" />
            <input
              type="email"
              value={formData.prepostoEmail}
              onChange={(e) => setFormData({ ...formData, prepostoEmail: e.target.value })}
              placeholder="Email do Preposto"
              className="w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-gray-200 dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40"
            />
          </div>

          {/* Preposto - Whatsapp */}
          <div className="relative">
            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none" />
            <input
              type="text"
              value={formData.prepostoWhatsapp}
              onChange={(e) => setFormData({ ...formData, prepostoWhatsapp: formatPhoneNumber(e.target.value) })}
              placeholder="WhatsApp do Preposto"
              className="w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-gray-200 dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className={`relative w-full px-6 py-3 rounded-xl text-white font-medium mt-4 overflow-hidden transition-colors
                       ${isSaving 
                         ? 'bg-[#E54A1D] cursor-not-allowed' 
                         : 'bg-[#FD5521] hover:bg-[#E54A1D]'}`}
          >
            {/* Animação de carregamento - preenchimento da esquerda para direita */}
            {isSaving && (
              <motion.div
                className="absolute inset-0 bg-[#D4441A]"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear'
                }}
              />
            )}
            
            {/* Texto do botão */}
            <span className="relative z-10">
              {isSaving ? 'Salvando alterações...' : 'Salvar Alterações'}
            </span>
          </button>
        </form>
      </div>

      {/* Bottom Sheets */}
      <SearchableBottomSheet
        isOpen={activeSheet === 'encarregado'}
        onClose={() => setActiveSheet(null)}
        title="Selecione o Encarregado"
        options={encarregados.map(enc => ({
          id: enc.id,
          label: enc.nome,
          sublabel: enc.email || enc.telefone
        }))}
        selectedId={formData.encarregadoId}
        onSelect={(id) => setFormData({ ...formData, encarregadoId: id })}
      />
      
      {/* Toast */}
      {ToastComponent}
    </motion.div>
  );
};

export default EditObraPage;