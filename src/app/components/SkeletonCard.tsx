import React from 'react';

/**
 * 💎 PROFISSIONALISMO: Skeleton loading state para cards de obras
 * 
 * Melhora a percepção de velocidade mostrando um placeholder animado
 * enquanto os dados carregam
 */

interface SkeletonCardProps {
  variant?: 'default' | 'list';
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ variant = 'default' }) => {
  if (variant === 'list') {
    return (
      <div className="px-5 py-4 animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-24 flex-shrink-0"></div>
            </div>
            <div className="flex items-center gap-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-3 animate-pulse">
      {/* Container principal */}
      <div className="rounded-xl px-5 py-4 mb-2.5 bg-gray-100 dark:bg-gray-800">
        {/* Título */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
        
        {/* ID e Data */}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        
        {/* Informações */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
      </div>
      
      {/* Rodapé */}
      <div className="flex items-center justify-between px-2.5">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
        <div className="flex gap-2">
          <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonUserCard: React.FC = () => {
  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4 animate-pulse">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
};

export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-white dark:border-gray-900 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        ))}
      </div>

      {/* Cards grandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-white dark:border-gray-900 p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
            <div className="h-[300px] bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonEncarregadoCard: React.FC = () => {
  return (
    <div className="p-5 rounded-xl border-l-4 border-l-gray-300 dark:border-l-gray-700 bg-white dark:bg-gray-900 animate-pulse">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
      </div>
      
      {/* Informações */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
        <div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>
      
      {/* Rodapé */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
};
