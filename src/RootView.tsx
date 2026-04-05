import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { PinUnlockView } from './components/auth/PinUnlockView';
import SplashView from './components/SplashView';
import ContentView from './ContentView';

export const RootView: React.FC = () => {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showPinUnlock, setShowPinUnlock] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);

  // Перевіряємо PIN при кожній зміні isAuthenticated або user
  useEffect(() => {
    const checkPin = async () => {
      console.log('🔐 ========== CHECKING PIN ==========');
      console.log('🔐 isAuthenticated:', isAuthenticated);
      console.log('🔐 user:', user?.email);
      console.log('🔐 user?.pinHash:', user?.pinHash);
      console.log('🔐 isUnlocked:', isUnlocked);
      console.log('🔐 showPinUnlock:', showPinUnlock);
      
      if (!isAuthenticated) {
        console.log('🔐 Not authenticated, resetting');
        setIsUnlocked(false);
        setShowPinUnlock(false);
        setChecked(false);
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
      
      if (checked) {
        console.log('🔐 Already checked');
        return;
      }
      
      setChecked(true);
      
      try {
        // Оновлюємо дані
        await refreshUser();
        
        const hasPin = !!user?.pinHash;
        console.log('🔐 Has PIN:', hasPin);
        
        if (hasPin) {
          console.log('🔐 ✅✅✅ SHOWING PIN SCREEN ✅✅✅');
          setShowPinUnlock(true);
        } else {
          console.log('🔐 No PIN, unlocking');
          setIsUnlocked(true);
        }
      } catch (error) {
        console.error('Error:', error);
        setIsUnlocked(true);
      }
    };
    
    checkPin();
  }, [isAuthenticated, user, isUnlocked, showPinUnlock, checked, refreshUser]);

  const handlePinSuccess = () => {
    console.log('🔐 PIN success, unlocking');
    setShowPinUnlock(false);
    setIsUnlocked(true);
  };

  if (showSplash) {
    return <SplashView onFinish={() => setShowSplash(false)} />;
  }

  if (showPinUnlock) {
    return <PinUnlockView onSuccess={handlePinSuccess} />;
  }

  return <ContentView />;
};
