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
      console.log('🔐 RootView: ========== PIN CHECK START ==========');
      console.log('🔐 isAuthenticated:', isAuthenticated);
      console.log('🔐 isLoading:', isLoading);
      console.log('🔐 user exists:', !!user);
      console.log('🔐 user?.email:', user?.email);
      console.log('🔐 user?.pinHash:', user?.pinHash);
      console.log('🔐 isUnlocked:', isUnlocked);
      console.log('🔐 showPinUnlock:', showPinUnlock);
      
      if (!isAuthenticated || !user) {
        console.log('🔐 Not authenticated or no user, skipping PIN check');
        return;
      }

      setIsCheckingPin(true);
      
      try {
        // Оновлюємо дані користувача з сервера
        await refreshUser();
        
        // Після refreshUser, user може оновитися, але в замиканні старий
        // Тому отримуємо свіжі дані через setTimeout
        setTimeout(async () => {
          const hasPin = !!user?.pinHash;
          console.log('🔐 After refresh - Has PIN:', hasPin);
          console.log('🔐 After refresh - pinHash:', user?.pinHash);
          
          if (hasPin && !isUnlocked && !showPinUnlock) {
            console.log('🔐 SHOWING PIN UNLOCK SCREEN');
            setShowPinUnlock(true);
          } else if (!hasPin) {
            console.log('🔐 No PIN set, going to content');
            setIsUnlocked(true);
            setShowPinUnlock(false);
          } else if (hasPin && isUnlocked) {
            console.log('🔐 Already unlocked, going to content');
            setShowPinUnlock(false);
          }
          setIsCheckingPin(false);
        }, 100);
      } catch (error) {
        console.error('Error checking PIN:', error);
        setIsUnlocked(true);
        setShowPinUnlock(false);
        setIsCheckingPin(false);
      }
    };
    
    if (!isLoading && isAuthenticated && user) {
      checkPin();
    }
  }, [isAuthenticated, user, isLoading, isUnlocked, showPinUnlock, refreshUser]);

  const handlePinSuccess = () => {
    console.log('🔐 PIN successfully entered');
    setShowPinUnlock(false);
    setIsUnlocked(true);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('🔐 User logged out, resetting state');
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
