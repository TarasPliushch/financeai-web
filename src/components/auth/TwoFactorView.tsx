// src/components/auth/TwoFactorView.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const TwoFactorView: React.FC = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const { verifyTwoFactor, requestPasswordReset } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = (location.state as { email?: string })?.email || '';

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Введіть 6-значний код');
      return;
    }
    setIsLoading(true);
    const success = await verifyTwoFactor(email, code);
    setIsLoading(false);
    if (success) {
      navigate('/');
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setIsLoading(true);
    await requestPasswordReset(email);
    setIsLoading(false);
    setResendCountdown(60);
    toast.success('Код надіслано повторно');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
            <span className="text-4xl">🛡️</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold">Двофакторна автентифікація</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Код надіслано на<br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Код підтвердження</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 6))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="000000"
              maxLength={6}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Перевірка...</span>
              </div>
            ) : (
              'Підтвердити'
            )}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center">
          {resendCountdown > 0 ? (
            <p className="text-sm text-muted-foreground">
              Надіслати повторно через {resendCountdown} с
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              Надіслати код повторно
            </button>
          )}
        </div>

        {/* Back to login */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            ← Повернутися до входу
          </button>
        </div>
      </div>
    </div>
  );
};
