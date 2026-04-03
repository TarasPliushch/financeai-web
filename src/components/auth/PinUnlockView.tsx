import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface PinUnlockViewProps {
  onSuccess: () => void;
}

// Функція для хешування PIN з різними варіантами
const hashPinVariants = async (pin: string, userId: string): Promise<{ method: string; hash: string }[]> => {
  const results = [];
  
  // Варіант 1: iOS формат (userId + pin)
  const input1 = userId + pin;
  const encoder = new TextEncoder();
  const data1 = encoder.encode(input1);
  const hashBuffer1 = await crypto.subtle.digest('SHA-256', data1);
  const hashArray1 = Array.from(new Uint8Array(hashBuffer1));
  const hexHash1 = hashArray1.map(b => b.toString(16).padStart(2, '0')).join('');
  results.push({ method: `userId+pin (${input1})`, hash: hexHash1 });
  
  // Варіант 2: pin + userId
  const input2 = pin + userId;
  const data2 = encoder.encode(input2);
  const hashBuffer2 = await crypto.subtle.digest('SHA-256', data2);
  const hashArray2 = Array.from(new Uint8Array(hashBuffer2));
  const hexHash2 = hashArray2.map(b => b.toString(16).padStart(2, '0')).join('');
  results.push({ method: `pin+userId (${input2})`, hash: hexHash2 });
  
  // Варіант 3: без userId (тільки pin)
  const input3 = pin;
  const data3 = encoder.encode(input3);
  const hashBuffer3 = await crypto.subtle.digest('SHA-256', data3);
  const hashArray3 = Array.from(new Uint8Array(hashBuffer3));
  const hexHash3 = hashArray3.map(b => b.toString(16).padStart(2, '0')).join('');
  results.push({ method: `only pin (${input3})`, hash: hexHash3 });
  
  // Варіант 4: userId без префікса "user_" + pin
  const cleanUserId = userId.replace('user_', '');
  const input4 = cleanUserId + pin;
  const data4 = encoder.encode(input4);
  const hashBuffer4 = await crypto.subtle.digest('SHA-256', data4);
  const hashArray4 = Array.from(new Uint8Array(hashBuffer4));
  const hexHash4 = hashArray4.map(b => b.toString(16).padStart(2, '0')).join('');
  results.push({ method: `cleanUserId+pin (${input4})`, hash: hexHash4 });
  
  // Варіант 5: pin + userId без префікса
  const input5 = pin + cleanUserId;
  const data5 = encoder.encode(input5);
  const hashBuffer5 = await crypto.subtle.digest('SHA-256', data5);
  const hashArray5 = Array.from(new Uint8Array(hashBuffer5));
  const hexHash5 = hashArray5.map(b => b.toString(16).padStart(2, '0')).join('');
  results.push({ method: `pin+cleanUserId (${input5})`, hash: hexHash5 });
  
  return results;
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
      await refreshUser();
      
      const storedHash = user?.pinHash;
      
      if (!storedHash) {
        toast.error('PIN-код не встановлено');
        setIsLoading(false);
        return;
      }
      
      const userId = user?.id || '';
      
      console.log('========== PIN VERIFICATION DEBUG ==========');
      console.log('User ID from API:', userId);
      console.log('User email:', user?.email);
      console.log('Entered PIN:', pin);
      console.log('Stored hash from server:', storedHash);
      
      // Перевіряємо всі варіанти хешування
      const variants = await hashPinVariants(pin, userId);
      
      console.log('All hash variants:');
      let foundMatch = false;
      let matchingMethod = '';
      
      for (const variant of variants) {
        console.log(`  ${variant.method}: ${variant.hash}`);
        if (variant.hash === storedHash) {
          foundMatch = true;
          matchingMethod = variant.method;
        }
      }
      
      console.log('Match found:', foundMatch);
      if (foundMatch) {
        console.log('Matching method:', matchingMethod);
      }
      console.log('============================================');
      
      if (foundMatch) {
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
