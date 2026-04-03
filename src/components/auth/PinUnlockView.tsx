import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface PinUnlockViewProps {
  onSuccess: () => void;
}

// Той самий метод хешування, що і в iOS додатку
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
  const { user, refreshUser } = useAuth();

  const handleNumberClick = (num: number) => {
    if (pin.length < 6) {
      setPin(pin + num.toString());
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const verifyPin = async () => {
    if (pin.length !== 6) {
      toast.error('Введіть 6-значний PIN-код');
      return;
    }

    setIsLoading(true);
    
    try {
      // Отримуємо актуальні дані користувача з сервера
      await refreshUser();
      
      const storedHash = user?.pinHash;
      
      if (!storedHash) {
        toast.error('PIN-код не встановлено');
        setIsLoading(false);
        return;
      }
      
      // Використовуємо той самий метод хешування, що в iOS
      const hashedInput = await hashPin(pin, user?.id || '');
      
      console.log('🔐 Перевірка PIN:');
      console.log('  Введений PIN:', pin);
      console.log('  User ID:', user?.id);
      console.log('  Хеш введеного:', hashedInput);
      console.log('  Хеш з сервера:', storedHash);
      
      if (storedHash === hashedInput) {
        toast.success('PIN-код правильний');
        onSuccess();
      } else {
        toast.error('Невірний PIN-код');
        setPin('');
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      toast.error('Помилка перевірки PIN');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDots = () => {
    return (
      <div className="flex gap-3 justify-center mb-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < pin.length ? 'bg-primary scale-110' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    );
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
          <p className="text-muted-foreground mt-2">
            Для доступу до застосунку
          </p>
        </div>

        {renderDots()}

        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
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

        <button
          onClick={verifyPin}
          disabled={pin.length !== 6 || isLoading}
          className="mt-8 w-full py-3 rounded-xl bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {isLoading ? 'Перевірка...' : 'Увійти'}
        </button>

        <button
          onClick={() => {
            // Повний вихід з акаунту
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            sessionStorage.removeItem('pinVerified');
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
