import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { PinUnlockView } from './components/auth/PinUnlockView';
import SplashView from './components/SplashView';
import ContentView from './ContentView';

export const RootView: React.FC = () => {
  const { isAuthenticated, user, isLoading, refreshUser } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    // Перевіряємо, чи потрібен PIN-код
    const checkPin = async () => {
      if (isAuthenticated && user) {
        // Оновлюємо дані користувача, щоб отримати актуальний pinHash
        await refreshUser();
        
        const hasPin = !!user?.pinHash;
        const wasUnlocked = localStorage.getItem('pinUnlocked') === 'true';
        
        if (hasPin && !wasUnlocked && !showPinUnlock) {
          setShowPinUnlock(true);
        } else if (hasPin && wasUnlocked) {
          setIsUnlocked(true);
        } else if (!hasPin) {
          setIsUnlocked(true);
        }
      }
    };
    
    checkPin();
  }, [isAuthenticated, user]);

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
