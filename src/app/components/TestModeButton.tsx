import React from 'react';

interface TestModeButtonProps {
  onClick: () => void;
}

export function TestModeButton({ onClick }: TestModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 bg-[#FD5521] text-white px-6 py-3 rounded-full shadow-lg hover:bg-[#E04A1C] transition-all z-50 flex items-center gap-2 animate-pulse hover:animate-none"
      title="Clique para ativar o Modo de Teste"
    >
      <span className="text-2xl">🧪</span>
      <span className="font-bold">TESTAR API</span>
    </button>
  );
}
