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
      if (!isAuthenticated || !user) {
        return;
      }

      setIsCheckingPin(true);
      
      try {
        await refreshUser();
        
        const hasPin = !!user?.pinHash;
        
        if (hasPin && !isUnlocked) {
          setShowPinUnlock(true);
        } else if (!hasPin) {
          setIsUnlocked(true);
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
    
    if (!isLoading && isAuthenticated && user) {
      checkPin();
    }
  }, [isAuthenticated, user, isLoading, isUnlocked]);

  const handlePinSuccess = () => {
    setShowPinUnlock(false);
    setIsUnlocked(true);
  };

  if (isLoading || showSplash || isCheckingPin) {
    return <SplashView onFinish={() => setShowSplash(false)} />;
  }

  if (showPinUnlock) {
    return <PinUnlockView onSuccess={handlePinSuccess} />;
  }

  return <ContentView />;
};
