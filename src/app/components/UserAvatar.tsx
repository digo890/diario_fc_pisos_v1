/**
 * Avatar circular com a inicial do usuário e cor derivada do ID.
 *
 * Extraído do AdminDashboard para isolar a lógica de cor/inicial num
 * componente reutilizável e testável, sem alterar o markup renderizado.
 */

// Paleta de cores para avatares
const AVATAR_COLORS = [
  'bg-[#FD5521]', // Laranja FC
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-rose-500',
];

// Cor determinística baseada no ID do usuário
export const getAvatarColor = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

interface UserAvatarProps {
  userId: string;
  nome: string;
  /** Classes de tamanho (padrão equivalente ao uso original: w-10 h-10). */
  className?: string;
}

export default function UserAvatar({ userId, nome, className = 'w-10 h-10' }: UserAvatarProps) {
  return (
    <div
      className={`${className} rounded-full ${getAvatarColor(userId)} text-white flex items-center justify-center font-medium flex-shrink-0`}
    >
      {nome.charAt(0).toUpperCase()}
    </div>
  );
}
