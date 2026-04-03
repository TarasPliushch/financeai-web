import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BiometricAuth } from './BiometricAuth';
import toast from 'react-hot-toast';

interface PinUnlockViewProps {
  onSuccess: () => void;
}

const hashPin = async (pin: string, userId: string): Promise<string> => {
  const input = userId + pin;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const PinUnlockView: React.FC<PinUnlockViewProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    checkMobile();
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pin.length === 6) {
      verifyPin();
    }
  };

  const verifyPin = async () => {
    // Очищаємо попередню помилку
    setError('');
    
    if (pin.length !== 6) {
      setError('Введіть 6-значний PIN-код');
      return;
    }

    setIsLoading(true);
    
    try {
      await refreshUser();
      
      const storedHash = user?.pinHash;
      
      if (!storedHash) {
        setError('PIN-код не встановлено');
        setIsLoading(false);
        return;
      }
      
      const userId = user?.id || '';
      const calculatedHash = await hashPin(pin, userId);
      
      if (calculatedHash === storedHash) {
        // Успішний вхід - без зайвих повідомлень
        onSuccess();
      } else {
        setError('Невірний PIN-код');
        setPin('');
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      setError('Помилка перевірки PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberClick = (num: number) => {
    if (pin.length < 6) {
      const newPin = pin + num.toString();
      setPin(newPin);
      setError('');
      // Не викликаємо verifyPin автоматично, чекаємо кнопку Увійти
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
    inputRef.current?.focus();
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Введіть PIN-код</h2>
          <p className="text-muted-foreground mt-2">Для доступу до застосунку</p>
        </div>

        {/* Поле для вводу PIN */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
            setPin(val);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="••••••"
          className="w-full text-center text-2xl tracking-widest py-4 rounded-xl border border-border bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
          autoFocus
        />

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {/* Цифрова клавіатура - ТІЛЬКИ ДЛЯ МОБІЛЬНИХ ПРИСТРОЇВ */}
        {isMobile && (
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className="w-16 h-16 rounded-full bg-secondary hover:bg-secondary/80 text-2xl font-medium transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="w-16 h-16 rounded-full bg-secondary hover:bg-secondary/80 text-sm transition-colors"
            >
              Очистити
            </button>
            <button
              onClick={() => handleNumberClick(0)}
              className="w-16 h-16 rounded-full bg-secondary hover:bg-secondary/80 text-2xl font-medium transition-colors"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="w-16 h-16 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                <line x1="18" y1="9" x2="12" y2="15"/>
                <line x1="12" y1="9" x2="18" y2="15"/>
              </svg>
            </button>
          </div>
        )}

        <button
          onClick={verifyPin}
          disabled={pin.length !== 6 || isLoading}
          className="mt-8 w-full py-3 rounded-xl bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {isLoading ? 'Перевірка...' : 'Увійти'}
        </button>

        {/* Біометрична автентифікація */}
        <BiometricAuth onSuccess={onSuccess} />

        <button
          onClick={() => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            window.location.href = '/login';
          }}
          className="mt-4 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Вийти з акаунту
        </button>
      </div>
    </div>
  );
};
