import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface BiometricAuthProps {
  onSuccess: () => void;
  onError?: (error: string) => void;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({ onSuccess, onError }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
    // Перевіряємо, чи увімкнена біометрія в налаштуваннях
    const enabled = localStorage.getItem('biometricEnabled') === 'true';
    const credentialId = localStorage.getItem('biometricCredentialId');
    console.log('🔐 Biometric enabled:', enabled, 'Credential exists:', !!credentialId);
    setBiometricEnabled(enabled && !!credentialId);
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      if (!window.PublicKeyCredential) {
        console.log('WebAuthn not supported');
        setIsAvailable(false);
        return;
      }

      if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsAvailable(available);
        console.log('🔐 Platform authenticator available:', available);
      } else {
        setIsAvailable(false);
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
    }
  };

  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const authenticateWithBiometric = async () => {
    // Перевіряємо, чи увімкнена біометрія
    const enabled = localStorage.getItem('biometricEnabled') === 'true';
    const credentialIdBase64 = localStorage.getItem('biometricCredentialId');
    
    console.log('🔐 Biometric auth check - enabled:', enabled, 'credentialId:', !!credentialIdBase64);
    
    if (!enabled || !credentialIdBase64) {
      console.log('🔐 Biometric is disabled or not configured');
      toast.error('Біометрична автентифікація не налаштована. Увімкніть її в налаштуваннях.');
      return;
    }

    setIsAuthenticating(true);
    
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      const credentialId = base64ToUint8Array(credentialIdBase64);
      
      const publicKeyCredentialRequestOptions = {
        challenge: challenge,
        allowCredentials: [{
          id: credentialId,
          type: 'public-key',
          transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
        }],
        rpId: window.location.hostname,
        userVerification: 'required' as const,
        timeout: 60000,
      };
      
      console.log('🔐 Requesting biometric authentication...');
      
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
        errorMsg = 'Біометрична автентифікація не підтримується';
      } else if (error.name === 'InvalidStateError') {
        errorMsg = 'Біометричні дані не знайдено. Налаштуйте їх в профілі.';
      } else {
        errorMsg = error.message || 'Помилка біометричної автентифікації';
      }
      
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Не показуємо кнопку, якщо біометрія недоступна або вимкнена
  if (!isAvailable || !biometricEnabled) {
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
