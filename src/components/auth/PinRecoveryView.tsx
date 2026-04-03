import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { PinSetupView } from './PinSetupView';

interface PinRecoveryViewProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const PinRecoveryView: React.FC<PinRecoveryViewProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<'email' | 'code' | 'newPin'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const { user } = useAuth();

  const handleRequestCode = async () => {
    if (!email) {
      toast.error('Введіть email');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.requestPinReset(email);
      if (response.success) {
        toast.success('Код надіслано на email');
        setStep('code');
      } else {
        toast.error(response.error || 'Помилка');
      }
    } catch (error) {
      toast.error('Помилка надсилання коду');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      toast.error('Введіть 6-значний код');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.verifyPinResetCode(email, code, '');
      if (response.success) {
        toast.success('Код підтверджено');
        setStep('newPin');
      } else {
        toast.error(response.error || 'Невірний код');
      }
    } catch (error) {
      toast.error('Помилка перевірки коду');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSetupSuccess = () => {
    setShowPinSetup(false);
    toast.success('PIN-код змінено!');
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold">
            {step === 'email' && 'Відновлення PIN-коду'}
            {step === 'code' && 'Перевірка коду'}
            {step === 'newPin' && 'Новий PIN-код'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {step === 'email' && 'Введіть email, на який зареєстровано акаунт'}
            {step === 'code' && `Код надіслано на ${email}`}
            {step === 'newPin' && 'Встановіть новий PIN-код'}
          </p>
        </div>

        {step === 'email' && (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
              autoFocus
            />
            <button
              onClick={handleRequestCode}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Надсилання...' : 'Надіслати код'}
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-widest py-3 rounded-xl border border-border bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
              autoFocus
            />
            <button
              onClick={handleVerifyCode}
              disabled={isLoading || code.length !== 6}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Перевірка...' : 'Підтвердити'}
            </button>
            <button
              onClick={() => setStep('email')}
              className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Назад
            </button>
          </>
        )}

        {step === 'newPin' && (
          <PinSetupView
            mode="setup"
            onSuccess={handlePinSetupSuccess}
            onCancel={onCancel}
          />
        )}

        <button
          onClick={onCancel}
          className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Скасувати
        </button>
      </div>
    </div>
  );
};
