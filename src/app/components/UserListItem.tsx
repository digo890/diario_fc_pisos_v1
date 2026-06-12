import { Edit2, Trash2 } from 'lucide-react';
import type { User } from '../types';
import UserAvatar from './UserAvatar';

/**
 * Linha da lista de usuários do AdminDashboard.
 * Componente presentacional (leaf): recebe o usuário e callbacks de ação.
 * Markup idêntico ao que estava inline no AdminDashboard.
 */
interface UserListItemProps {
  user: User;
  showDivider: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UserListItem({ user, showDivider, onEdit, onDelete }: UserListItemProps) {
  return (
    <div>
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <UserAvatar userId={user.id} nome={user.nome} />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">{user.nome}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{user.tipo}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(user)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            title="Editar"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            title="Excluir"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      {showDivider && (
        <div className="mx-5 border-b border-[#EDEFE4] dark:border-gray-800"></div>
      )}
    </div>
  );
}
