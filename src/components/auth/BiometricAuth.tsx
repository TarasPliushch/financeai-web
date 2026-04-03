import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface BiometricAuthProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

declare global {
  interface Window {
    Platform: any;
    webkit: any;
  }
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({ onSuccess, onCancel }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    // Перевіряємо доступність біометрії в браузері
    if (window.PublicKeyCredential && 
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsAvailable(available);
    }
    
    // Для macOS Touch ID через WebAuthn
    if (window.Platform?.macOS && !isAvailable) {
      setIsAvailable(true);
    }
  };

  const authenticateWithBiometric = async () => {
    setIsAuthenticating(true);
    
    try {
      // Отримуємо challenge з сервера
      const challengeResponse = await api.getBiometricChallenge();
      if (!challengeResponse.success) {
        throw new Error('Не вдалося отримати challenge');
      }

      // Створюємо запит на автентифікацію
      const publicKeyCredentialRequestOptions = {
        challenge: Uint8Array.from(atob(challengeResponse.challenge), c => c.charCodeAt(0)),
        allowCredentials: challengeResponse.allowCredentials?.map((cred: any) => ({
          id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)),
          type: cred.type,
          transports: cred.transports,
        })),
        timeout: 60000,
        userVerification: 'required',
        rpId: window.location.hostname,
      };

      // Викликаємо WebAuthn API
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (credential) {
        // Відправляємо credential на сервер для верифікації
        const authResponse = await api.authenticateBiometric({
          id: (credential as any).id,
          type: (credential as any).type,
          response: {
            clientDataJSON: Array.from(new Uint8Array((credential as any).response.clientDataJSON)),
            authenticatorData: Array.from(new Uint8Array((credential as any).response.authenticatorData)),
            signature: Array.from(new Uint8Array((credential as any).response.signature)),
            userHandle: (credential as any).response.userHandle 
              ? Array.from(new Uint8Array((credential as any).response.userHandle))
              : null,
          },
        });

        if (authResponse.success) {
          toast.success('Біометрична автентифікація успішна!');
          onSuccess();
        } else {
          toast.error(authResponse.error || 'Помилка автентифікації');
        }
      }
    } catch (error: any) {
      console.error('Biometric auth error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Автентифікацію скасовано');
      } else if (error.name === 'NotSupportedError') {
        toast.error('Біометрична автентифікація не підтримується');
      } else {
        toast.error('Помилка біометричної автентифікації');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isAvailable) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={authenticateWithBiometric}
        disabled={isAuthenticating}
        className="flex items-center gap-3 px-6 py-3 rounded-xl border border-border hover:bg-secondary transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2a5 5 0 0 0-5 5v4a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/>
          <path d="M5 14v2a7 7 0 0 0 14 0v-2"/>
          <circle cx="12" cy="16" r="1"/>
        </svg>
        <span>{isAuthenticating ? 'Перевірка...' : 'Увійти за допомогою відбитку пальця'}</span>
      </button>
      {onCancel && (
        <button onClick={onCancel} className="text-sm text-muted-foreground hover:text-foreground">
          Використати PIN-код
        </button>
      )}
    </div>
  );
};
