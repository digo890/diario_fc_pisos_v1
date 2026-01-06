import React, { createContext, useContext, useState, useEffect } from 'react';
import { getConfig, saveConfig } from '../utils/database';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    // Carregar tema salvo
    const loadTheme = async () => {
      try {
        const savedTheme = await getConfig('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
          document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    await saveConfig('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
};

// ============================================
// Fast Refresh - Garantir compatibilidade
// ============================================

// Marcar componentes para preservação durante Fast Refresh
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Adicionar display name para melhor debugging
ThemeProvider.displayName = 'ThemeProvider';
ThemeContext.displayName = 'ThemeContext';