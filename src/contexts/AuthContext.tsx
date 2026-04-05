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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
  const [pendingTwoFactorEmail, setPendingTwoFactorEmail] = useState('');

  useEffect(() => { 
    loadUser(); 
  }, []);

  const loadUser = async () => {
    const token = api.getToken();
    console.log('🔐 Auth: loadUser started, token exists:', !!token);
    
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await api.getCurrentUser();
      console.log('🔐 Auth: getCurrentUser response:', response);
      
      if (response.user) {
        setUser(response.user);
        api.setUserId(response.user.id);
        console.log('✅ Auth: User loaded, email:', response.user.email);
        console.log('✅ Auth: PIN hash:', response.user.pinHash);
      } else {
        console.log('🔐 Auth: No user in response');
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
    console.log('🔄 Auth: refreshUser called');
    try {
      const token = api.getToken();
      if (token) {
        const response = await api.getCurrentUser();
        console.log('🔄 Auth: refreshUser response:', response);
        if (response.user) {
          setUser(response.user);
          console.log('✅ Auth: User refreshed, PIN hash:', response.user.pinHash);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const hashPin = async (pin: string, userId: string): Promise<string> => {
    const input = userId + pin;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const checkPin = async (pin: string): Promise<{ success: boolean; error?: string; blocked?: boolean; attemptsLeft?: number }> => {
    const storedHash = user?.pinHash;
    
    console.log('🔐 Auth: checkPin called');
    console.log('🔐 Auth: storedHash:', storedHash);
    
    if (!storedHash) {
      return { success: false, error: 'PIN-код не встановлено' };
    }
    
    const userId = user?.id || '';
    const calculatedHash = await hashPin(pin, userId);
    
    console.log('🔐 Auth: User ID:', userId);
    console.log('🔐 Auth: Entered PIN:', pin);
    console.log('🔐 Auth: Calculated hash:', calculatedHash);
    console.log('🔐 Auth: Stored hash:', storedHash);
    console.log('🔐 Auth: Match:', calculatedHash === storedHash);
    
    if (calculatedHash === storedHash) {
      return { success: true };
    } else {
      return { success: false, error: 'Невірний PIN-код' };
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response: AuthResponse = await api.login(email, password);
      if (response.requires2FA) { 
        setPendingTwoFactorEmail(email); 
        toast.info('Код 2FA надіслано на email');
        return false; 
      }
      if (response.token && response.user) {
        api.setToken(response.token);
        setUser(response.user);
        api.setUserId(response.user.id);
        if (response.user.isEmailVerified === false) setRequiresEmailVerification(true);
        
        localStorage.setItem('lastEmail', email);
        
        console.log('✅ Auth: Login successful, user:', response.user.email);
        console.log('✅ Auth: PIN hash from login:', response.user.pinHash);
        
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
