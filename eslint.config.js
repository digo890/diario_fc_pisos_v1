import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

// ESLint 9 (flat config). Substitui o antigo .eslintrc.cjs, que não era lido
// pelo ESLint 9 — o `npm run lint` ficava quebrado.
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      // Estáticos / service worker (globais próprios; não é código de app).
      'public/**',
      // Edge Functions rodam no Deno (globais/imports próprios) — lint à parte.
      'supabase/functions/**',
      // Wrappers shadcn/ui (estilo de terceiros, gerados).
      'src/app/components/ui/**',
      '**/*.config.{js,ts,cjs,mjs}',
      'src/vite-env.d.ts',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // O TypeScript já verifica variáveis/tipos não definidos; `no-undef` gera
      // falsos positivos com tipos do TS (RequestInit, etc). Desligar é o padrão.
      'no-undef': 'off',
      // Regras de hooks (bugs reais viram erro):
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // `any` é onipresente (herança do Figma Make) — sinalizar tudo seria ruído.
      '@typescript-eslint/no-explicit-any': 'off',
      // Usa a versão do typescript-eslint (a base duplicaria os avisos).
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      // Itens legados rebaixados a aviso (visíveis, não bloqueiam o gate):
      'no-case-declarations': 'warn',
      'no-useless-catch': 'warn',
      'no-prototype-builtins': 'warn',
    },
  },
  prettier,
];
