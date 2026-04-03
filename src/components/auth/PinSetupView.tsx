import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface PinSetupViewProps {
  onSuccess?: () => void;
  mode?: 'setup' | 'change';
}

export const PinSetupView: React.FC<PinSetupViewProps> = ({ onSuccess, mode = 'setup' }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

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

  // Хешування PIN (простий SHA-256)
  const hashPin = async (pinCode: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pinCode + (user?.id || 'default'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
        const hashedPin = await hashPin(pin);
        const success = await updateProfile({ pinHash: hashedPin });
        setIsLoading(false);
        if (success) {
          toast.success(mode === 'setup' ? 'PIN-код встановлено!' : 'PIN-код змінено!');
          localStorage.setItem('pinEnabled', 'true');
          if (onSuccess) onSuccess();
          else navigate('/profile');
        }
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
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold">
          {mode === 'setup' ? 'Встановлення PIN-коду' : 'Зміна PIN-коду'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {step === 'enter' 
            ? 'Введіть 6-значний PIN-код' 
            : 'Підтвердіть PIN-код'}
        </p>
      </div>

      {renderDots(step === 'enter' ? pin.length : confirmPin.length)}

      {/* Цифрова клавіатура */}
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
        onClick={handleSubmit}
        disabled={(step === 'enter' ? pin.length !== 6 : confirmPin.length !== 6) || isLoading}
        className="mt-8 px-8 py-3 rounded-xl bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {isLoading ? 'Збереження...' : step === 'enter' ? 'Далі' : 'Підтвердити'}
      </button>
    </div>
  );
};
