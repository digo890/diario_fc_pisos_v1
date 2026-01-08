import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/index.css';
import { registerServiceWorker } from './app/utils/registerSW';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Registrar Service Worker (também em DEV para testes)
if (import.meta.env.PROD || import.meta.env.DEV) {
  registerServiceWorker();
}