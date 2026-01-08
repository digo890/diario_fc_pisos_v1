import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, UserRound, Shield, Mail, Phone, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { saveUser } from '../utils/database';
import { userApi } from '../utils/api';
import type { User, UserRole } from '../types';
import { useToast } from './Toast';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const CreateUserPage: React.FC<Props> = ({ onBack, onSuccess }) => {
  const { showToast, ToastComponent } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Encarregado' as UserRole | '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: ''
  });

  const [errors, setErrors] = useState({
    nome: false,
    tipo: false,
    email: false,
    senhas: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevenir múltiplos cliques
    if (isCreating) return;

    let hasErrors = false;
    const newErrors = { nome: false, tipo: false, email: false, senhas: false };

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
      newErrors.senhas = true;
      hasErrors = true;
      showToast('As senhas não coincidem', 'error');
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsCreating(true);

    try {
      // Criar usuário no backend (Supabase)
      const response = await userApi.create({
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha || 'senha123', // Senha padrão se não fornecida
        tipo: formData.tipo
      });

      if (response.success) {
        // Salvar também localmente no IndexedDB
        const novoUser: User = {
          id: response.data.id, // Usar o ID gerado pelo backend
          nome: formData.nome,
          tipo: formData.tipo as UserRole,
          email: formData.email,
          telefone: formData.telefone,
          createdAt: Date.now()
        };

        await saveUser(novoUser);
        showToast('Usuário criado com sucesso!', 'success');
        
        // Aguardar um pouco para o usuário ver o toast antes de voltar
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        showToast(`Erro ao criar usuário: ${response.error}`, 'error');
      }
    } catch (error: any) {
      console.error('❌ Erro ao criar usuário:', error);
      showToast(`Erro ao criar usuário: ${error.message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

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
      <div className="flex-1 overflow-y-auto bg-[#EDEFE4] dark:bg-gray-900">
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
                       border border-gray-200 dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       ${errors.nome ? 'ring-2 ring-red-500' : ''}`}
              placeholder="Nome completo *"
            />
            {errors.nome && <p className="text-red-500 text-xs mt-1 ml-1">Campo obrigatório</p>}
          </div>

          {/* Tipo de Perfil - Bottom Sheet Trigger */}
          <div>
            <div className={`relative inline-flex w-full p-1 bg-[#DDE1D7] dark:bg-gray-800 rounded-lg ${errors.tipo ? 'ring-2 ring-red-500' : ''}`}>
              {/* Background slider */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-900 rounded-md shadow-md transition-transform duration-200 ease-out ${
                  formData.tipo === 'Administrador' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'
                }`}
              />
              
              {/* Encarregado Button */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'Encarregado' })}
                className={`relative z-10 flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  formData.tipo === 'Encarregado'
                    ? 'text-[#FD5521]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Encarregado
              </button>
              
              {/* Administrador Button */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'Administrador' })}
                className={`relative z-10 flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  formData.tipo === 'Administrador'
                    ? 'text-[#FD5521]'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Administrador
              </button>
            </div>
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
                       border border-gray-200 dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500
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
                       border border-gray-200 dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500
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
                       border border-gray-200 dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500
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
              className={`w-full pl-12 pr-12 py-3 rounded-xl 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-gray-200 dark:border-gray-800
                       placeholder:text-[#C6CCC2] dark:placeholder:text-gray-500
                       focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40
                       ${errors.senhas ? 'ring-2 ring-red-500' : ''}`}
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
            {errors.senhas && <p className="text-red-500 text-xs mt-1 ml-1">As senhas não coincidem</p>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating}
            className="relative w-full px-6 py-3 rounded-xl bg-[#FD5521] text-white font-medium hover:bg-[#E54A1D] transition-colors mt-6 focus:outline-none focus:ring-2 focus:ring-[#FD5521]/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            {/* Animação de preenchimento horizontal */}
            {isCreating && (
              <motion.div
                className="absolute inset-0 bg-[#E54A1D]"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'linear' }}
              />
            )}
            <span className="relative z-10">
              {isCreating ? 'Criando usuário...' : 'Criar Usuário'}
            </span>
          </button>
        </form>
      </div>

      {/* Toast */}
      {ToastComponent}
    </motion.div>
  );
};

export default CreateUserPage;
