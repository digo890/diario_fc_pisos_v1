// Registro do Service Worker para funcionalidade PWA offline

export const registerServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registrado com sucesso:', registration);

      // Verificar atualizações periodicamente
      setInterval(() => {
        registration.update();
      }, 60000); // A cada 1 minuto
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
    }
  }
};
