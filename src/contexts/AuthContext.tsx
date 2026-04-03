import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { User, AuthResponse } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresEmailVerification: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  verifyEmail: (code: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  verifyTwoFactor: (email: string, code: string) => Promise<boolean>;
  pendingTwoFactorEmail: string;
  checkPin: (pin: string) => Promise<{ success: boolean; error?: string; blocked?: boolean; attemptsLeft?: number }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const LOGIN_TIME_KEY = 'loginTimestamp';
const SESSION_DURATION_DAYS = 30;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
  const [pendingTwoFactorEmail, setPendingTwoFactorEmail] = useState('');

  useEffect(() => { 
    loadUser(); 
  }, []);

  const checkSessionExpiry = (): boolean => {
    const loginTime = localStorage.getItem(LOGIN_TIME_KEY);
    if (!loginTime) return false;
    const loginTimestamp = parseInt(loginTime, 10);
    const elapsed = Date.now() - loginTimestamp;
    if (elapsed >= SESSION_DURATION_MS) return true;
    return false;
  };

  const loadUser = async () => {
    const token = api.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    if (checkSessionExpiry()) {
      logout();
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await api.getCurrentUser();
      if (response.user) {
        setUser(response.user);
        api.setUserId(response.user.id);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
    finally { 
      setIsLoading(false); 
    }
  };

  const refreshUser = async () => {
    try {
      const token = api.getToken();
      if (token) {
        const response = await api.getCurrentUser();
        if (response.user) {
          setUser(response.user);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const checkPin = async (pin: string): Promise<{ success: boolean; error?: string; blocked?: boolean; attemptsLeft?: number }> => {
    try {
      const token = api.getToken();
      const userId = api.getUserId();
      
      if (!token || !userId) {
        return { success: false, error: 'Не авторизовано' };
      }
      
      const response = await fetch('https://my-finance-app-2026-production.up.railway.app/api/auth/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'user-id': userId
        },
        body: JSON.stringify({ pin })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || 'Невірний PIN', 
          blocked: data.blocked,
          attemptsLeft: data.attemptsLeft 
        };
      }
    } catch (error) {
      return { success: false, error: 'Помилка перевірки PIN' };
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await api.login(email, password);
      if (response.requires2FA) { 
        setPendingTwoFactorEmail(email); 
        toast.info('Код 2FA надіслано на ваш email');
        return false; 
      }
      if (response.token && response.user) {
        api.setToken(response.token);
        setUser(response.user);
        api.setUserId(response.user.id);
        if (response.user.isEmailVerified === false) setRequiresEmailVerification(true);
        
        localStorage.setItem(LOGIN_TIME_KEY, Date.now().toString());
        localStorage.setItem('lastEmail', email);
        
        toast.success('Вхід виконано!');
        return true;
      }
      toast.error(response.error || 'Помилка входу');
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка входу');
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await api.register(email, password, name);
      if (response.token && response.user) {
        api.setToken(response.token);
        setUser(response.user);
        api.setUserId(response.user.id);
        if (response.requiresVerification) setRequiresEmailVerification(true);
        
        localStorage.setItem(LOGIN_TIME_KEY, Date.now().toString());
        localStorage.setItem('lastEmail', email);
        
        toast.success('Реєстрація успішна!');
        return true;
      }
      toast.error(response.error || 'Помилка реєстрації');
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка реєстрації');
      return false;
    }
  };

  const verifyTwoFactor = async (email: string, code: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await api.verifyTwoFactor(email, code);
      if (response.token && response.user) {
        api.setToken(response.token);
        setUser(response.user);
        api.setUserId(response.user.id);
        setPendingTwoFactorEmail('');
        
        localStorage.setItem(LOGIN_TIME_KEY, Date.now().toString());
        localStorage.setItem('lastEmail', email);
        
        toast.success('2FA підтверджено!');
        return true;
      }
      toast.error(response.error || 'Невірний код');
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка верифікації');
      return false;
    }
  };

  const logout = () => {
    api.setToken(null);
    api.setUserId(null);
    setUser(null);
    setRequiresEmailVerification(false);
    sessionStorage.removeItem('pinVerified');
    localStorage.removeItem('pinUnlocked');
    toast.success('Ви вийшли');
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const response = await api.updateProfile(data);
      if (response.success && response.user) {
        setUser(response.user);
        toast.success('Профіль оновлено');
        return true;
      }
      toast.error('Помилка оновлення');
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка оновлення');
      return false;
    }
  };

  const verifyEmail = async (code: string): Promise<boolean> => {
    try {
      const response = await api.verifyEmail(code);
      if (response.success) {
        setRequiresEmailVerification(false);
        toast.success('Email підтверджено!');
        return true;
      }
      toast.error(response.error || 'Невірний код');
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка верифікації');
      return false;
    }
  };

  const resendVerification = async (): Promise<boolean> => {
    try {
      const response = await api.resendVerification();
      if (response.success) { toast.success('Код надіслано повторно'); return true; }
      toast.error(response.error || 'Помилка');
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка');
      return false;
    }
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    try {
      const response = await api.requestPasswordReset(email);
      if (response.success) { toast.success('Код надіслано на email'); return true; }
      toast.error(response.error || 'Помилка');
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка');
      return false;
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await api.resetPassword(email, code, newPassword);
      if (response.success) { toast.success('Пароль змінено!'); return true; }
      toast.error(response.error || 'Невірний код');
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Помилка');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAuthenticated: !!user, requiresEmailVerification,
      login, register, logout, updateProfile, refreshUser, verifyEmail, resendVerification,
      requestPasswordReset, resetPassword, verifyTwoFactor, pendingTwoFactorEmail,
      checkPin
    }}>
      {children}
    </AuthContext.Provider>
  );
};
