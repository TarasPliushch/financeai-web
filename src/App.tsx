import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Layout } from './components/common/Layout';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { EmailVerificationView } from './components/auth/EmailVerificationView';
import { TwoFactorView } from './components/auth/TwoFactorView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { GoalsView } from './components/goals/GoalsView';
import { ShoppingListView } from './components/shopping/ShoppingListView';
import { ChatView } from './components/chat/ChatView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { ProfileView } from './components/profile/ProfileView';
import { DebugView } from './components/DebugView';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, requiresEmailVerification } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiresEmailVerification) return <Navigate to="/verify-email" replace />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isDark } = useTheme();
  React.useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />
          <Route path="/forgot-password" element={<ForgotPasswordView />} />
          <Route path="/verify-email" element={<EmailVerificationView />} />
          <Route path="/2fa" element={<TwoFactorView />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/finances" replace />} />
            <Route path="finances" element={<ExpensesView />} />
            <Route path="goals" element={<GoalsView />} />
            <Route path="shopping" element={<ShoppingListView />} />
            <Route path="chat" element={<ChatView />} />
            <Route path="notifications" element={<NotificationsView />} />
            <Route path="profile" element={<ProfileView />} />
            <Route path="debug" element={<DebugView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
