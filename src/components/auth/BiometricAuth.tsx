import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface BiometricAuthProps {
  onSuccess: () => void;
  onError?: (error: string) => void;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({ onSuccess, onError }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      // Перевіряємо наявність WebAuthn API
      if (!window.PublicKeyCredential) {
        console.log('WebAuthn not supported');
        setIsSupported(false);
        setIsAvailable(false);
        return;
      }

      // Перевіряємо наявність платформного аутентифікатора (Touch ID / Windows Hello)
      if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsAvailable(available);
        console.log('🔐 Platform authenticator available:', available);
      } else {
        setIsAvailable(false);
      }

      // Також перевіряємо, чи є в браузері підтримка
      const isMac = navigator.userAgent.indexOf('Mac') !== -1;
      const isWindows = navigator.userAgent.indexOf('Windows') !== -1;
      const isChrome = navigator.userAgent.indexOf('Chrome') !== -1;
      const isEdge = navigator.userAgent.indexOf('Edg') !== -1;
      
      console.log('🔐 Biometric check:', { isMac, isWindows, isChrome, isEdge });
      
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
    }
  };

  const authenticateWithBiometric = async () => {
    setIsAuthenticating(true);
    
    try {
      // Перевіряємо підтримку
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn не підтримується в цьому браузері');
      }

      // Для macOS з Touch ID та Windows з Hello
      // Створюємо запит на автентифікацію
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      const publicKeyCredentialRequestOptions = {
        challenge: challenge,
        rpId: window.location.hostname,
        userVerification: 'required' as const,
        timeout: 60000,
      };
      
      console.log('🔐 Requesting biometric authentication...');
      
      // Викликаємо системний діалог біометрії
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });
      
      if (credential) {
        console.log('🔐 Biometric authentication successful');
        toast.success('Біометрична автентифікація успішна!');
        onSuccess();
      } else {
        throw new Error('Автентифікацію скасовано');
      }
    } catch (error: any) {
      console.error('Biometric auth error:', error);
      
      let errorMsg = 'Помилка біометричної автентифікації';
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Автентифікацію скасовано';
      } else if (error.name === 'NotSupportedError') {
        errorMsg = 'Біометрична автентифікація не підтримується в цьому браузері';
      } else if (error.message === 'WebAuthn не підтримується в цьому браузері') {
        errorMsg = error.message;
      } else {
        errorMsg = 'Біометрична автентифікація не налаштована. Використовуйте PIN-код.';
      }
      
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Не показуємо кнопку, якщо біометрія недоступна
  if (!isAvailable || !isSupported) {
    return null;
  }

  return (
    <button
      onClick={authenticateWithBiometric}
      disabled={isAuthenticating}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-secondary transition-colors mt-4"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a5 5 0 0 0-5 5v4a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/>
        <path d="M5 14v2a7 7 0 0 0 14 0v-2"/>
        <circle cx="12" cy="16" r="1"/>
      </svg>
      <span>{isAuthenticating ? 'Перевірка...' : 'Увійти за допомогою відбитку пальця'}</span>
    </button>
  );
};
