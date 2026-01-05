import React, { useState, useEffect } from 'react';
import App from './App';
import AutoSetup from './components/AutoSetup';

const AppWrapper: React.FC = () => {
  const [setupComplete, setSetupComplete] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(true);

  useEffect(() => {
    // Verificar se já rodou o setup antes
    const hasRunSetup = localStorage.getItem('diario-obras-setup-complete');
    if (hasRunSetup === 'true') {
      setIsFirstRun(false);
      setSetupComplete(true);
    }
  }, []);

  const handleSetupComplete = () => {
    localStorage.setItem('diario-obras-setup-complete', 'true');
    setSetupComplete(true);
  };

  // Se é a primeira vez, mostrar AutoSetup
  if (isFirstRun && !setupComplete) {
    return <AutoSetup onComplete={handleSetupComplete} />;
  }

  return <App />;
};

export default AppWrapper;