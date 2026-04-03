import React, { useState } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ isEnabled, onToggle }) => {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!isEnabled) {
      setShowCodeInput(true);
    } else {
      setIsLoading(true);
      try {
        const response = await api.disable2FA();
        if (response.success) {
          toast.success('2FA вимкнено');
          onToggle();
        } else {
          toast.error(response.error || 'Помилка');
        }
      } catch (error) {
        toast.error('Помилка вимкнення 2FA');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      toast.error('Введіть 6-значний код');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.verify2FACode(code);
      if (response.success) {
        toast.success('2FA увімкнено');
        setShowCodeInput(false);
        setCode('');
        onToggle();
      } else {
        toast.error(response.error || 'Невірний код');
      }
    } catch (error) {
      toast.error('Помилка верифікації');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
        <span className="flex items-center gap-2">
          <span className="text-lg">🔐</span> Двофакторна автентифікація (2FA)
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggle}
            disabled={isLoading}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {showCodeInput && (
        <div className="p-4 rounded-xl bg-secondary/30">
          <p className="text-sm text-muted-foreground mb-3">
            Код підтвердження надіслано на ваш email
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              className="flex-1 text-center text-xl tracking-widest py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <button
              onClick={handleVerifyCode}
              disabled={isLoading || code.length !== 6}
              className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50"
            >
              Підтвердити
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
