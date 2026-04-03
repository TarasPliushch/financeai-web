import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface BiometricAuthProps {
  onSuccess: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    PublicKeyCredential: any;
  }
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({ onSuccess, onError }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      // Перевіряємо наявність WebAuthn API
      if (window.PublicKeyCredential && 
          typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsAvailable(available);
        console.log('🔐 WebAuthn available:', available);
      }
    } catch (error) {
      console.log('WebAuthn not supported:', error);
      setIsAvailable(false);
    }
  };

  const authenticateWithBiometric = async () => {
    setIsAuthenticating(true);
    
    try {
      // Перевіряємо, чи підтримується WebAuthn
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn не підтримується в цьому браузері');
      }

      // Створюємо запит на автентифікацію
      // Для простоти використовуємо базову перевірку через SimpleWebAuthn
      // В реальному проекті потрібно налаштувати сервер для WebAuthn
      
      // Тимчасове рішення - використовуємо SimpleWebAuthn бібліотеку
      // Або показуємо повідомлення про необхідність налаштування
      
      // Для macOS з Touch ID та Windows з Hello
      if (window.Platform?.macOS || window.Platform?.win32) {
        // Спроба використати WebAuthn через браузер
        const publicKeyCredentialRequestOptions = {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          userVerification: 'required',
          timeout: 60000,
        };
        
        // Це спробує викликати системний діалог біометрії
        const credential = await navigator.credentials.get({
          publicKey: publicKeyCredentialRequestOptions as any
        }).catch(() => null);
        
        if (credential) {
          toast.success('Біометрична автентифікація успішна!');
          onSuccess();
        } else {
          throw new Error('Автентифікацію скасовано');
        }
      } else {
        throw new Error('Біометрична автентифікація не налаштована');
      }
    } catch (error: any) {
      console.error('Biometric auth error:', error);
      const errorMsg = error.message || 'Помилка біометричної автентифікації';
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isAvailable) {
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
