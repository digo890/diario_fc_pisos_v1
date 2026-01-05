import React, { useState, useEffect } from 'react';
import { UserCog, HardHat } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUsers } from '../utils/database';
import type { User, UserRole } from '../types';
import FcLogo from '../../imports/FcLogo';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const allUsers = await getUsers();
    setUsers(allUsers);
  };

  const handleRoleSelect = async (role: UserRole) => {
    setLoading(true);
    // Buscar o primeiro usuário do perfil selecionado
    const userOfRole = users.find(u => u.tipo === role);
    if (userOfRole) {
      await login(userOfRole.id);
    }
    setLoading(false);
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Administrador':
        return <UserCog className="w-12 h-12" />;
      case 'Encarregado':
        return <HardHat className="w-12 h-12" />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 rounded-full bg-[#FD5521] flex items-center justify-center p-5 shadow-[0_0_30px_rgba(253,85,33,0.4)]">
            <FcLogo />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Diário de Obras
        </h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-12">
          FC Pisos - V1
        </p>

        {/* Seleção de perfil */}
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelect('Administrador')}
            disabled={loading}
            className="w-full p-6 rounded-xl border-2 border-gray-200 dark:border-gray-800
                     hover:border-[#FD5521] dark:hover:border-[#FD5521]
                     transition-all hover:shadow-lg
                     bg-white dark:bg-gray-900
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="text-[#FD5521]">
                {getRoleIcon('Administrador')}
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                Administrador
              </span>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect('Encarregado')}
            disabled={loading}
            className="w-full p-6 rounded-xl border-2 border-gray-200 dark:border-gray-800
                     hover:border-[#FD5521] dark:hover:border-[#FD5521]
                     transition-all hover:shadow-lg
                     bg-white dark:bg-gray-900
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="text-[#FD5521]">
                {getRoleIcon('Encarregado')}
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                Encarregado
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;