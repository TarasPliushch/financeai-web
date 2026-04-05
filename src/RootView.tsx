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
  const [loginTime, setLoginTime] = useState<number | null>(null);

  // Відстежуємо час останнього логіну через localStorage
  useEffect(() => {
    const checkLoginTime = () => {
      const lastLogin = localStorage.getItem('lastLoginTime');
      if (lastLogin) {
        setLoginTime(parseInt(lastLogin));
      }
    };
    checkLoginTime();
    
    // Слухаємо зміни в localStorage (для випадку, якщо логін в іншій вкладці)
    const handleStorageChange = () => {
      const lastLogin = localStorage.getItem('lastLoginTime');
      if (lastLogin) {
        setLoginTime(parseInt(lastLogin));
        // Скидаємо стан при новому логіні
        setIsUnlocked(false);
        setShowPinUnlock(false);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Перевірка PIN при зміні часу логіну або автентифікації
  useEffect(() => {
    const checkPin = async () => {
      console.log('🔐 ========== PIN CHECK ==========');
      console.log('🔐 isAuthenticated:', isAuthenticated);
      console.log('🔐 isLoading:', isLoading);
      console.log('🔐 loginTime:', loginTime);
      console.log('🔐 isUnlocked:', isUnlocked);
      console.log('🔐 showPinUnlock:', showPinUnlock);
      
      if (!isAuthenticated) {
        console.log('🔐 Not authenticated');
        return;
      }
      
      if (isLoading) {
        console.log('🔐 Still loading');
        return;
      }
      
      if (isUnlocked) {
        console.log('🔐 Already unlocked');
        return;
      }
      
      if (showPinUnlock) {
        console.log('🔐 Already showing PIN screen');
        return;
      }
      
      console.log('🔐 Checking PIN...');
      
      try {
        // Оновлюємо дані користувача
        await refreshUser();
        
        // Перевіряємо наявність PIN
        const hasPin = !!user?.pinHash;
        console.log('🔐 Has PIN:', hasPin);
        console.log('🔐 PIN hash:', user?.pinHash);
        
        if (hasPin) {
          console.log('🔐 ✅ SHOWING PIN UNLOCK SCREEN');
          setShowPinUnlock(true);
        } else {
          console.log('🔐 No PIN set, auto-unlock');
          setIsUnlocked(true);
        }
      } catch (error) {
        console.error('Error checking PIN:', error);
        setIsUnlocked(true);
      }
    };
    
    if (isAuthenticated && !isLoading && !isUnlocked && !showPinUnlock) {
      checkPin();
    }
  }, [isAuthenticated, isLoading, isUnlocked, showPinUnlock, loginTime, refreshUser, user]);

  const handlePinSuccess = () => {
    console.log('🔐 PIN correct, unlocking app');
    setShowPinUnlock(false);
    setIsUnlocked(true);
  };

  if (isLoading || showSplash) {
    return <SplashView onFinish={() => setShowSplash(false)} />;
  }

  // Показуємо PIN екран
  if (showPinUnlock) {
    return <PinUnlockView onSuccess={handlePinSuccess} />;
  }

  return <ContentView />;
};
