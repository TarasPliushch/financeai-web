import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface PinSetupViewProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: 'setup' | 'change';
}

// Той самий метод хешування, що в iOS
const hashPin = async (pin: string, userId: string): Promise<string> => {
  const input = userId + pin;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const PinSetupView: React.FC<PinSetupViewProps> = ({ onSuccess, onCancel, mode = 'setup' }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateProfile, refreshUser } = useAuth();

  const handleNumberClick = (num: number) => {
    if (step === 'enter' && pin.length < 6) {
      setPin(pin + num.toString());
    } else if (step === 'confirm' && confirmPin.length < 6) {
      setConfirmPin(confirmPin + num.toString());
    }
  };

  const handleDelete = () => {
    if (step === 'enter') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (step === 'enter') {
      setPin('');
    } else {
      setConfirmPin('');
    }
  };

  const handleSubmit = async () => {
    if (step === 'enter') {
      if (pin.length === 6) {
        setStep('confirm');
        setConfirmPin('');
      } else {
        toast.error('Введіть 6-значний PIN-код');
      }
    } else {
      if (pin !== confirmPin) {
        toast.error('PIN-коди не співпадають');
        setPin('');
        setConfirmPin('');
        setStep('enter');
      } else {
        setIsLoading(true);
        const userId = user?.id || '';
        const hashedPin = await hashPin(pin, userId);
        
        console.log('========== PIN SETUP ==========');
        console.log('User ID:', userId);
        console.log('PIN:', pin);
        console.log('Hash to save:', hashedPin);
        console.log('===============================');
        
        const success = await updateProfile({ pinHash: hashedPin });
        if (success) {
          await refreshUser();
          toast.success(mode === 'setup' ? 'PIN-код встановлено!' : 'PIN-код змінено!');
          if (onSuccess) onSuccess();
        } else {
          toast.error('Помилка збереження PIN');
        }
        setIsLoading(false);
      }
    }
  };

  const renderDots = (length: number) => {
    return (
      <div className="flex gap-3 justify-center mb-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < length ? 'bg-primary scale-110' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold">
          {mode === 'setup' ? 'Встановлення PIN-коду' : 'Зміна PIN-коду'}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {step === 'enter' 
            ? 'Введіть 6-значний PIN-код' 
            : 'Підтвердіть PIN-код'}
        </p>
      </div>

      {renderDots(step === 'enter' ? pin.length : confirmPin.length)}

      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            className="w-14 h-14 rounded-full bg-secondary hover:bg-secondary/80 text-xl font-medium transition-colors"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="w-14 h-14 rounded-full bg-secondary hover:bg-secondary/80 text-xs transition-colors"
        >
          Очистити
        </button>
        <button
          onClick={() => handleNumberClick(0)}
          className="w-14 h-14 rounded-full bg-secondary hover:bg-secondary/80 text-xl font-medium transition-colors"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-14 h-14 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
            <line x1="18" y1="9" x2="12" y2="15"/>
            <line x1="12" y1="9" x2="18" y2="15"/>
          </svg>
        </button>
      </div>

      <div className="flex gap-3 mt-6">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors"
          >
            Скасувати
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={(step === 'enter' ? pin.length !== 6 : confirmPin.length !== 6) || isLoading}
          className={`${onCancel ? 'flex-1' : 'w-full'} py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all`}
        >
          {isLoading ? 'Збереження...' : step === 'enter' ? 'Далі' : 'Підтвердити'}
        </button>
      </div>
    </div>
  );
};
