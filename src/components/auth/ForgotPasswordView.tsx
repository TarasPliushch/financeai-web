// src/components/auth/ForgotPasswordView.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

type Step = 'email' | 'code' | 'password' | 'success';

export const ForgotPasswordView: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Введіть email');
      return;
    }
    setIsLoading(true);
    const success = await requestPasswordReset(email);
    setIsLoading(false);
    if (success) {
      setStep('code');
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Введіть 6-значний код');
      return;
    }
    setStep('password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Пароль повинен містити мінімум 6 символів');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Паролі не збігаються');
      return;
    }
    setIsLoading(true);
    const success = await resetPassword(email, code, newPassword);
    setIsLoading(false);
    if (success) {
      setStep('success');
    }
  };

  const getIcon = () => {
    switch (step) {
      case 'email': return '📧';
      case 'code': return '🔑';
      case 'password': return '🔒';
      case 'success': return '✅';
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'email': return 'Відновлення пароля';
      case 'code': return 'Перевірка коду';
      case 'password': return 'Новий пароль';
      case 'success': return 'Успішно!';
    }
  };

  const getDescription = () => {
    switch (step) {
      case 'email': return 'Введіть ваш email, ми надішлемо код для відновлення';
      case 'code': return `Код надіслано на ${email}`;
      case 'password': return 'Придумайте новий надійний пароль';
      case 'success': return 'Пароль успішно змінено!';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg">
            <span className="text-4xl">{getIcon()}</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold">{getTitle()}</h1>
          <p className="mt-2 text-muted-foreground text-sm">{getDescription()}</p>
        </div>

        {/* Form */}
        {step === 'email' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="your@email.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Надсилання...</span>
                </div>
              ) : (
                'Надіслати код'
              )}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
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
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Підтвердити
            </button>
            <button
              type="button"
              onClick={() => requestPasswordReset(email)}
              className="w-full text-sm text-primary hover:underline"
            >
              Надіслати код повторно
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Новий пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Підтвердіть пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Збереження...</span>
                </div>
              ) : (
                'Змінити пароль'
              )}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-muted-foreground">Тепер ви можете увійти з новим паролем</p>
            </div>
            <Link
              to="/login"
              className="block w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white text-center font-semibold hover:opacity-90 transition-opacity"
            >
              Увійти
            </Link>
          </div>
        )}

        {/* Back to login */}
        {step !== 'success' && (
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              ← Повернутися до входу
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
