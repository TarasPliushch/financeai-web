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
  const [isCheckingPin, setIsCheckingPin] = useState(false);

  useEffect(() => {
    const checkPin = async () => {
      // Якщо користувач не автентифікований - не показуємо PIN
      if (!isAuthenticated || !user) {
        setIsUnlocked(false);
        setShowPinUnlock(false);
        return;
      }

      setIsCheckingPin(true);
      
      try {
        // Оновлюємо дані користувача
        await refreshUser();
        
        const hasPin = !!user?.pinHash;
        
        console.log('🔐 RootView: перевірка PIN');
        console.log('  isAuthenticated:', isAuthenticated);
        console.log('  hasPin:', hasPin);
        console.log('  isUnlocked:', isUnlocked);
        
        // Якщо PIN встановлений і ще не розблоковано - показуємо екран PIN
        if (hasPin && !isUnlocked) {
          setShowPinUnlock(true);
        } else if (!hasPin) {
          // Якщо PIN не встановлений - одразу в контент
          setIsUnlocked(true);
          setShowPinUnlock(false);
        } else if (hasPin && isUnlocked) {
          // Якщо вже розблоковано - одразу в контент
          setShowPinUnlock(false);
        }
      } catch (error) {
        console.error('Error checking PIN:', error);
        setIsUnlocked(true);
        setShowPinUnlock(false);
      } finally {
        setIsCheckingPin(false);
      }
    };
    
    checkPin();
  }, [isAuthenticated, user, isUnlocked]);

  const handlePinSuccess = () => {
    console.log('🔐 PIN успішно введено');
    setShowPinUnlock(false);
    setIsUnlocked(true);
  };

  // Якщо користувач вийшов - скидаємо стан
  useEffect(() => {
    if (!isAuthenticated) {
      setIsUnlocked(false);
      setShowPinUnlock(false);
    }
  }, [isAuthenticated]);

  if (isLoading || showSplash || isCheckingPin) {
    return <SplashView onFinish={() => setShowSplash(false)} />;
  }

  if (showPinUnlock) {
    return <PinUnlockView onSuccess={handlePinSuccess} />;
  }

  return <ContentView />;
};
