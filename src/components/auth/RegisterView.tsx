import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const RegisterView: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('Паролі не збігаються'); return; }
    if (password.length < 6) { toast.error('Пароль має бути мінімум 6 символів'); return; }
    setIsLoading(true);
    const success = await register(email, password, name);
    setIsLoading(false);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg"><span className="text-4xl">🧠</span></div>
          <h1 className="mt-4 text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">FinanceAI</h1>
          <p className="mt-2 text-muted-foreground">Створіть акаунт</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-2">Ім'я</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Ваше ім'я" required /></div>
          <div><label className="block text-sm font-medium mb-2">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="your@email.com" required /></div>
          <div><label className="block text-sm font-medium mb-2">Пароль</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="••••••" required /></div>
          <div><label className="block text-sm font-medium mb-2">Підтвердіть пароль</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="••••••" required /></div>
          <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 disabled:opacity-50">{isLoading ? 'Реєстрація...' : 'Зареєструватися'}</button>
        </form>
        <div className="mt-6 text-center"><Link to="/login" className="text-sm text-primary hover:underline">Вже є акаунт? Увійти</Link></div>
      </div>
    </div>
  );
};
