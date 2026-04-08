import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_URL = 'https://my-finance-app-2026-production.up.railway.app/api';

type Status = 'processing' | 'success' | 'expired' | 'error';

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  background: '#ffffff',
  borderRadius: '24px',
  padding: '40px 32px',
  boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
  textAlign: 'center',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const page: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  background: 'linear-gradient(135deg, #f5f5f7 0%, #e8e8f0 100%)',
};

const title: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  marginBottom: '8px',
  color: '#1c1c1e',
};

const subtitle: React.CSSProperties = {
  color: '#6c6c70',
  lineHeight: 1.6,
  marginBottom: '24px',
};

export const UnblockPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const started = useRef(false);

  useEffect(() => {
    // Prevent double-invoke in React StrictMode
    if (started.current) return;
    started.current = true;

    if (!token) {
      setStatus('error');
      setErrorMsg('Посилання не містить токена.');
      return;
    }

    autoUnblock(token);
  }, []);

  const autoUnblock = async (t: string) => {
    try {
      // 1. Verify token is still valid
      const statusRes = await fetch(`${API_URL}/auth/unblock-status?token=${t}`);
      const statusData = await statusRes.json();

      if (!statusData.success) {
        // Token not found — already used or never existed
        setStatus('error');
        setErrorMsg('Посилання вже використано або недійсне.');
        return;
      }

      // 2. Perform unblock immediately — no button click needed
      const unblockRes = await fetch(`${API_URL}/auth/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t }),
      });
      const unblockData = await unblockRes.json();

      if (unblockData.success) {
        setStatus('success');
      } else if (unblockData.error === 'Термін дії посилання вийшов') {
        setStatus('expired');
      } else {
        setStatus('error');
        setErrorMsg(unblockData.error || 'Невідома помилка розблокування.');
      }
    } catch {
      setStatus('error');
      setErrorMsg("Помилка з'єднання з сервером. Перевірте інтернет та спробуйте ще раз.");
    }
  };

  return (
    <div style={page}>
      <div style={card}>
        {status === 'processing' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
            <h1 style={title}>Розблокування акаунту…</h1>
            <p style={subtitle}>Будь ласка, зачекайте кілька секунд.</p>
            <div style={{
              width: 40, height: 40,
              border: '3px solid #e5e5ea',
              borderTopColor: '#FF2D55',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h1 style={title}>Акаунт розблоковано!</h1>
            <p style={subtitle}>
              Поверніться до застосунку FinanceAI —<br />
              доступ відновиться автоматично.
            </p>
            <div style={{
              background: 'linear-gradient(135deg, #34C759, #30B855)',
              borderRadius: '16px',
              padding: '14px 24px',
              color: '#fff',
              fontWeight: 600,
              fontSize: 15,
            }}>
              Можна закрити цю сторінку
            </div>
          </>
        )}

        {status === 'expired' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⏰</div>
            <h1 style={title}>Термін дії вийшов</h1>
            <p style={{ ...subtitle, marginBottom: 0 }}>
              Посилання більше не дійсне. Зачекайте 30 хвилин —
              блокування знімається автоматично.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
            <h1 style={title}>Помилка</h1>
            <p style={{ ...subtitle, marginBottom: 0 }}>
              {errorMsg || 'Посилання недійсне або вже використане.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};
