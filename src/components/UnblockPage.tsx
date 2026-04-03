import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = 'https://my-finance-app-2026-production.up.railway.app/api';

export const UnblockPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    checkStatus();
  }, [token]);

  const checkStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/unblock-status?token=${token}`);
      const data = await response.json();
      if (data.success) {
        setEmail(data.email);
        setStatus('loading');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const handleUnblock = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Акаунт розблоковано!');
        setStatus('success');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error(data.error || 'Помилка розблокування');
        setStatus('error');
      }
    } catch (error) {
      toast.error('Помилка розблокування');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Недійсне посилання</h1>
          <p className="text-muted-foreground mb-6">Посилання для розблокування недійсне або вже використане.</p>
          <button onClick={() => navigate('/login')} className="px-6 py-2 rounded-xl bg-primary text-white">Перейти до входу</button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">Акаунт розблоковано!</h1>
          <p className="text-muted-foreground mb-6">Ви будете перенаправлені на сторінку входу...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-4">🔓</div>
        <h1 className="text-2xl font-bold mb-2">Розблокування акаунту</h1>
        <p className="text-muted-foreground mb-6">
          Ваш акаунт було заблоковано через 3 невдалі спроби введення PIN-коду.
          {email && <span className="block mt-2 text-sm">Email: <strong>{email}</strong></span>}
        </p>
        <button
          onClick={handleUnblock}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? 'Розблокування...' : 'Розблокувати акаунт'}
        </button>
        <button onClick={() => navigate('/login')} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
          ← Повернутися до входу
        </button>
      </div>
    </div>
  );
};
