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

  // Перевірка PIN при завантаженні та при зміні автентифікації
  useEffect(() => {
    const checkPin = async () => {
      if (!isAuthenticated || !user) {
        // Якщо не автентифікований - не показуємо PIN
        setIsUnlocked(false);
        setShowPinUnlock(false);
        return;
      }

      setIsCheckingPin(true);
      
      try {
        // Оновлюємо дані користувача, щоб отримати актуальний pinHash
        await refreshUser();
        
        const hasPin = !!user?.pinHash;
        
        // Завжди показуємо PIN, якщо він встановлений (незалежно від localStorage)
        if (hasPin && !isUnlocked) {
          setShowPinUnlock(true);
        } else if (!hasPin) {
          // Якщо PIN не встановлений - одразу пропускаємо
          setIsUnlocked(true);
          setShowPinUnlock(false);
        }
      } catch (error) {
        console.error('Error checking PIN:', error);
        // У разі помилки - пропускаємо PIN перевірку
        setIsUnlocked(true);
        setShowPinUnlock(false);
      } finally {
        setIsCheckingPin(false);
      }
    };
    
    checkPin();
  }, [isAuthenticated, user, isUnlocked]);

  const handlePinSuccess = () => {
    setShowPinUnlock(false);
    setIsUnlocked(true);
    // Після успішного введення PIN - очищаємо прапорець розблокування при закритті
    sessionStorage.setItem('pinVerified', 'true');
  };

  // Якщо користувач вийшов - скидаємо стан
  useEffect(() => {
    if (!isAuthenticated) {
      setIsUnlocked(false);
      setShowPinUnlock(false);
      sessionStorage.removeItem('pinVerified');
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
