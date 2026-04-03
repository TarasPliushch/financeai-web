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
    console.log('🔐 AuthProvider mounted, loading user...');
    loadUser(); 
  }, []);

  const checkSessionExpiry = (): boolean => {
    const loginTime = localStorage.getItem(LOGIN_TIME_KEY);
    if (!loginTime) {
      console.log('🔐 No login time found');
      return false;
    }
    
    const loginTimestamp = parseInt(loginTime, 10);
    const now = Date.now();
    const elapsed = now - loginTimestamp;
    const daysElapsed = elapsed / (24 * 60 * 60 * 1000);
    
    console.log(`🔐 Session age: ${daysElapsed.toFixed(1)} days`);
    
    if (elapsed >= SESSION_DURATION_MS) {
      console.log('🔐 Session expired after 30 days');
      return true;
    }
    return false;
  };

  const loadUser = async () => {
    console.log('🔐 loadUser started');
    const token = api.getToken();
    console.log('🔐 Token exists:', !!token);
    
    if (!token) {
      console.log('🔐 No token, finishing loading');
      setIsLoading(false);
      return;
    }
    
    // Перевіряємо сесію
    if (checkSessionExpiry()) {
      console.log('🔐 Session expired, logging out');
      logout();
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('🔐 Fetching current user...');
      const response = await api.getCurrentUser();
      console.log('🔐 Response success:', response.success);
      console.log('🔐 Response error:', response.error);
      
      if (response.success && response.user) {
        setUser(response.user);
        api.setUserId(response.user.id);
        console.log('✅ User loaded:', response.user.email);
      } else if (response.error === 'Token expired' || response.error === 'Invalid token') {
        // Тільки при явній помилці токена виходимо
        console.log('🔐 Token expired/invalid, logging out');
        logout();
      } else {
        // При інших помилках (наприклад, мережевих) залишаємо токен
        console.log('🔐 Server error, keeping token but user is null');
        // Не виходимо з акаунту, просто немає користувача
      }
    } catch (error) {
      console.error('🔐 Error loading user:', error);
      // При помилці мережі, не виходимо з акаунту
      console.log('🔐 Network error, keeping token');
    }
    finally { 
      setIsLoading(false); 
    }
  };

  const refreshUser = async () => {
    console.log('🔄 Оновлення даних користувача...');
    try {
      const token = api.getToken();
      if (token) {
        const response = await api.getCurrentUser();
        if (response.success && response.user) {
          setUser(response.user);
          console.log('✅ Дані користувача оновлено, pinHash:', response.user.pinHash ? 'є' : 'немає');
        }
      }
    } catch (error) {
      console.error('❌ Помилка оновлення:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await api.login(email, password);
      if (response.requires2FA) { setPendingTwoFactorEmail(email); return false; }
      if (response.token && response.user) {
        api.setToken(response.token);
        setUser(response.user);
        api.setUserId(response.user.id);
        if (response.user.isEmailVerified === false) setRequiresEmailVerification(true);
        
        localStorage.setItem(LOGIN_TIME_KEY, Date.now().toString());
        localStorage.setItem('lastEmail', email);
        
        console.log('✅ Login successful, token saved');
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
    console.log('🔐 Logging out');
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
      requestPasswordReset, resetPassword, verifyTwoFactor, pendingTwoFactorEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};
