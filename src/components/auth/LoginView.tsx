import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const { login, verifyTwoFactor, pendingTwoFactorEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('lastEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    if (pendingTwoFactorEmail) {
      setPendingEmail(pendingTwoFactorEmail);
      setShow2FA(true);
    }
  }, [pendingTwoFactorEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(email, password);
    setIsLoading(false);
    
    if (success) {
      // Зберігаємо час успішного логіну
      localStorage.setItem('lastLoginTime', Date.now().toString());
      navigate('/');
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error('Введіть 6-значний код');
      return;
    }
    setIsLoading(true);
    const success = await verifyTwoFactor(pendingEmail, twoFactorCode);
    setIsLoading(false);
    if (success) {
      localStorage.setItem('lastLoginTime', Date.now().toString());
      navigate('/');
    }
  };

  if (show2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg">
              <span className="text-4xl">🔐</span>
            </div>
            <h1 className="mt-4 text-2xl font-bold">Двофакторна автентифікація</h1>
            <p className="mt-2 text-muted-foreground">
              Код надіслано на {pendingEmail}
            </p>
          </div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="000000"
            className="w-full text-center text-2xl tracking-widest py-4 rounded-xl border border-border bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
            autoFocus
          />
          <button
            onClick={handleVerify2FA}
            disabled={isLoading || twoFactorCode.length !== 6}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Перевірка...' : 'Підтвердити'}
          </button>
          <button
            onClick={() => setShow2FA(false)}
            className="mt-4 w-full py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Повернутися до входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg">
            <span className="text-4xl">🧠</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            FinanceAI
          </h1>
          <p className="mt-2 text-muted-foreground">Ласкаво просимо!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Вхід...</span>
              </div>
            ) : (
              'Увійти'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Забули пароль?
          </Link>
          <div>
            <Link to="/register" className="text-sm text-primary hover:underline">
              Немає акаунту? Зареєструватися
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
