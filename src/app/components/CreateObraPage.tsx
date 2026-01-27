import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Calendar, UserRound, Building2, MapPin, HardHat, Mail, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { saveObra } from '../utils/database';
import { obraApi } from '../utils/api';
import { sendEncarregadoNovaObraEmail } from '../utils/emailApi';
import type { User, Obra, UserRole } from '../types';
import SearchableBottomSheet from './SearchableBottomSheet';
import { useToast } from './Toast';

interface Props {
  users: User[];
  onBack: () => void;
  onSuccess: () => void;
}

const CreateObraPage: React.FC<Props> = ({ users, onBack, onSuccess }) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    cliente: '',
    obra: '',
    cidade: '',
    data: new Date().toISOString().split('T')[0],
    encarregadoId: '',
    prepostoNome: '',
    prepostoEmail: ''
  });

  const [errors, setErrors] = useState({
    cliente: false,
    obra: false,
    cidade: false,
    encarregadoId: false,
    prepostoContato: false
  });

  const [isCreating, setIsCreating] = useState(false);

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

    // 🔒 BLOQUEIO LÓGICO: Prevenir múltiplos cliques/submits
    if (isCreating) return;

    let hasErrors = false;
    const newErrors = { ...errors };

    if (!formData.cliente) {
      newErrors.cliente = true;
      hasErrors = true;
    } else {
      newErrors.cliente = false;
    }

    if (!formData.obra) {
      newErrors.obra = true;
      hasErrors = true;
    } else {
      newErrors.obra = false;
    }

    if (!formData.cidade) {
      newErrors.cidade = true;
      hasErrors = true;
    } else {
      newErrors.cidade = false;
    }

    if (!formData.encarregadoId) {
      newErrors.encarregadoId = true;
      hasErrors = true;
    } else {
      newErrors.encarregadoId = false;
    }

    // Validar que há pelo menos um meio de contato do preposto
    if (!formData.prepostoEmail) {
      newErrors.prepostoContato = true;
      hasErrors = true;
    } else {
      newErrors.prepostoContato = false;
    }

    setErrors(newErrors);

    if (hasErrors) {
      return;
    }

    setIsCreating(true);

    try {
      // Criar obra no backend primeiro
      const response = await obraApi.create({
        cliente: formData.cliente,
        obra: formData.obra,
        cidade: formData.cidade,
        data: formData.data,
        encarregado_id: formData.encarregadoId,
        preposto_nome: formData.prepostoNome || undefined,
        preposto_email: formData.prepostoEmail || undefined,
        status: 'novo',
        progress: 0,
        created_by: 'admin'
      });

      if (response.success) {
        // Salvar também localmente (com conversão de campos)
        const novaObra: Obra = {
          id: response.data.id,
          cliente: response.data.cliente,
          obra: response.data.obra,
          cidade: response.data.cidade,
          data: response.data.data,
          encarregadoId: response.data.encarregado_id,
          prepostoNome: response.data.preposto_nome,
          prepostoEmail: response.data.preposto_email,
          validationToken: response.data.token_validacao,
          validationTokenExpiry: response.data.token_validacao_expiry ? new Date(response.data.token_validacao_expiry).getTime() : undefined,
          status: response.data.status,
          progress: response.data.progress || 0,
          createdAt: new Date(response.data.created_at).getTime(),
          createdBy: response.data.created_by
        };

        await saveObra(novaObra);

        // ✅ NOTIFICAÇÃO: Enviar email ao encarregado
        if (response.data.encarregado_email) {
          const emailResult = await sendEncarregadoNovaObraEmail({
            encarregadoEmail: response.data.encarregado_email,
            encarregadoNome: response.data.encarregado_nome || 'Encarregado',
            obraNome: response.data.obra,
            cliente: response.data.cliente,
            cidade: response.data.cidade,
            prepostoNome: response.data.preposto_nome || 'Cliente',
            obraId: response.data.id,
          });

          if (!emailResult.success) {
            // Não bloqueia a criação da obra se falhar o envio do email
            showToast('⚠️ Obra criada mas houve erro ao enviar email ao encarregado', 'warning');
          }
        }

        onSuccess();
      } else {
        showToast(`Erro ao criar obra: ${response.error}`, 'error');
      }
    } catch (error: any) {
      showToast(`Erro ao criar obra: ${error.message}`, 'error');
    } finally {
      setIsCreating(false);
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
            Nova Obra
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#EDEFE4] dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 space-y-3">
          {/* Cliente */}
          <div className="relative group">
            <UserRound className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none transition-colors group-focus-within:text-[#FD5521]" />
            <input
              type="text"
              value={formData.cliente}
              onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
              className={`w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-transparent dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       ${errors.cliente ? 'ring-2 ring-red-500' : ''}`}
              placeholder="Cliente *"
            />
            {errors.cliente && <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>}
          </div>

          {/* Obra */}
          <div className="relative group">
            <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none transition-colors group-focus-within:text-[#FD5521]" />
            <input
              type="text"
              value={formData.obra}
              onChange={(e) => setFormData({ ...formData, obra: e.target.value })}
              className={`w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-transparent dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       ${errors.obra ? 'ring-2 ring-red-500' : ''}`}
              placeholder="Obra *"
            />
            {errors.obra && <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>}
          </div>

          {/* Cidade */}
          <div className="relative group">
            <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none transition-colors group-focus-within:text-[#FD5521]" />
            <input
              type="text"
              value={formData.cidade}
              onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
              className={`w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-transparent dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       ${errors.cidade ? 'ring-2 ring-red-500' : ''}`}
              placeholder="Cidade *"
            />
            {errors.cidade && <p className="text-red-500 text-sm mt-1">Campo obrigatório</p>}
          </div>

          {/* Data */}
          <div className="relative group">
            <Calendar className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none transition-colors group-focus-within:text-[#FD5521]" />
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              className="w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-transparent dark:border-gray-800
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40"
            />
          </div>

          {/* Encarregado - Bottom Sheet Trigger */}
          <div className="relative group">
            <HardHat className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none z-10 transition-colors group-focus-within:text-[#FD5521]" />
            <button
              type="button"
              onClick={() => setActiveSheet('encarregado')}
              className={`w-full pl-12 pr-4 py-3 rounded-xl
                       bg-white dark:bg-gray-800 text-left flex items-center justify-between
                       border border-transparent dark:border-gray-800
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
          <div className="relative group">
            <UserRound className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none transition-colors group-focus-within:text-[#FD5521]" />
            <input
              type="text"
              value={formData.prepostoNome}
              onChange={(e) => setFormData({ ...formData, prepostoNome: e.target.value })}
              className={`w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-transparent dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40`}
              placeholder="Nome do Preposto"
            />
          </div>

          {/* Preposto - Email */}
          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-[#C6CCC2] pointer-events-none transition-colors group-focus-within:text-[#FD5521]" />
            <input
              type="email"
              value={formData.prepostoEmail}
              onChange={(e) => setFormData({ ...formData, prepostoEmail: e.target.value })}
              className={`w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-transparent dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40`}
              placeholder="Email do Preposto"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating}
            className={`relative w-full px-6 py-3 rounded-xl text-white font-medium mt-4 overflow-hidden transition-colors
                       ${isCreating
                ? 'bg-[#E54A1D] cursor-not-allowed'
                : 'bg-[#FD5521] hover:bg-[#E54A1D]'}`}
          >
            {/* Animação de carregamento - preenchimento da esquerda para direita */}
            {isCreating && (
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
              {isCreating ? 'Criando obra...' : 'Criar diário da obra'}
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
    </motion.div>
  );
};

export default CreateObraPage;