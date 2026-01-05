import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, ChevronRight, UserRound, Shield, Mail, Phone, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { saveUser } from '../utils/database';
import type { User, UserRole } from '../types';
import BottomSheet from './BottomSheet';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const CreateUserPage: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '' as UserRole | '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: ''
  });

  const [errors, setErrors] = useState({
    nome: false,
    tipo: false,
    email: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTipoSheet, setShowTipoSheet] = useState(false);

  const tipoOptions = [
    { id: 'Administrador', label: 'Administrador', sublabel: 'Acesso total ao sistema' },
    { id: 'Encarregado', label: 'Encarregado', sublabel: 'Preenche formulários de obras' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasErrors = false;
    const newErrors = { nome: false, tipo: false, email: false };

    if (!formData.nome) {
      newErrors.nome = true;
      hasErrors = true;
    }

    if (!formData.tipo) {
      newErrors.tipo = true;
      hasErrors = true;
    }

    if (!formData.email) {
      newErrors.email = true;
      hasErrors = true;
    }

    if (formData.senha && formData.senha !== formData.confirmarSenha) {
      alert('As senhas não coincidem');
      return;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    const novoUser: User = {
      id: `user-${Date.now()}`,
      nome: formData.nome,
      tipo: formData.tipo as UserRole,
      email: formData.email,
      telefone: formData.telefone,
      senha: formData.senha || undefined,
      createdAt: Date.now()
    };

    await saveUser(novoUser);
    onSuccess();
  };

  const selectedTipo = tipoOptions.find(opt => opt.id === formData.tipo);

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    
    // Aplica a máscara
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 7) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
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
            Novo Usuário
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#EDEFE4] dark:bg-gray-950">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 space-y-3">
          {/* Nome */}
          <div className="relative">
            <UserRound className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#C6CCC2] dark:text-gray-600 pointer-events-none" />
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className={`w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       ${errors.nome ? 'ring-2 ring-red-500' : ''}`}
              placeholder="Nome completo *"
            />
            {errors.nome && <p className="text-red-500 text-xs mt-1 ml-1">Campo obrigatório</p>}
          </div>

          {/* Tipo de Perfil - Bottom Sheet Trigger */}
          <div>
            <button
              type="button"
              onClick={() => setShowTipoSheet(true)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-left flex items-center justify-between
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       ${errors.tipo ? 'ring-2 ring-red-500' : ''}
                       ${selectedTipo ? 'text-gray-900 dark:text-white' : ''} relative`}
            >
              <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#C6CCC2] dark:text-gray-600 pointer-events-none" />
              <div className="flex-1">
                <div className={selectedTipo ? 'text-gray-900 dark:text-white' : 'text-[#C6CCC2] dark:text-gray-600'}>
                  {selectedTipo?.label || 'Tipo de perfil *'}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            {errors.tipo && <p className="text-red-500 text-xs mt-1 ml-1">Campo obrigatório</p>}
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#C6CCC2] dark:text-gray-600 pointer-events-none" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       ${errors.email ? 'ring-2 ring-red-500' : ''}`}
              placeholder="Email *"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">Campo obrigatório</p>}
          </div>

          {/* Telefone */}
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#C6CCC2] dark:text-gray-600 pointer-events-none" />
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
              className="w-full pl-12 pr-4 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40"
              placeholder="Telefone"
            />
          </div>

          {/* Senha */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#C6CCC2] dark:text-gray-600 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              className="w-full pl-12 pr-12 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40"
              placeholder="Senha"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#C6CCC2] dark:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Confirmar Senha */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#C6CCC2] dark:text-gray-600 pointer-events-none" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmarSenha}
              onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
              className="w-full pl-12 pr-12 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-600
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40"
              placeholder="Confirmar senha"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#C6CCC2] dark:text-gray-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full px-6 py-3 rounded-xl bg-[#FD5521] text-white font-medium hover:bg-[#E54A1D] transition-colors mt-6 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40 focus:ring-offset-2"
          >
            Criar Usuário
          </button>
        </form>
      </div>

      {/* Tipo Bottom Sheet */}
      <BottomSheet
        isOpen={showTipoSheet}
        onClose={() => setShowTipoSheet(false)}
        title="Tipo de Perfil"
        options={tipoOptions}
        selectedId={formData.tipo}
        onSelect={(id) => setFormData({ ...formData, tipo: id as UserRole })}
      />
    </motion.div>
  );
};

export default CreateUserPage;