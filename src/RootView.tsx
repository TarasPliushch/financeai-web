import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { PinUnlockView } from './components/auth/PinUnlockView';
import SplashView from './components/SplashView';
import ContentView from './ContentView';

export const RootView: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // Перевіряємо, чи потрібен PIN-код
    if (isAuthenticated && user?.pinHash && !isUnlocked && !showPinUnlock) {
      setShowPinUnlock(true);
    }
  }, [isAuthenticated, user?.pinHash, isUnlocked]);

  const handlePinSuccess = () => {
    setShowPinUnlock(false);
    setIsUnlocked(true);
  };

  if (isLoading || showSplash) {
    return <SplashView onFinish={() => setShowSplash(false)} />;
  }

  if (showPinUnlock) {
    return <PinUnlockView onSuccess={handlePinSuccess} />;
  }

  return <ContentView />;
};
