import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const navigation = [
  { name: 'Фінанси', path: '/finances', icon: '💰' },
  { name: 'Цілі', path: '/goals', icon: '🎯' },
  { name: 'Покупки', path: '/shopping', icon: '🛒' },
  { name: 'Чат', path: '/chat', icon: '💬' },
  { name: 'Сповіщення', path: '/notifications', icon: '🔔' },
  { name: 'Профіль', path: '/profile', icon: '👤' },
];

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-secondary/80 backdrop-blur-lg transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-center border-b border-border">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">FinanceAI</h1>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary'}`} onClick={() => setSidebarOpen(false)}>
                <span className="text-xl">{item.icon}</span><span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-2xl">{user?.avatarEmoji || '👤'}</div>
              <div className="flex-1"><p className="text-sm font-medium">{user?.name}</p><p className="text-xs text-muted-foreground">{user?.email}</p></div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Тема</span>
              <select value={theme} onChange={(e) => setTheme(e.target.value as any)} className="rounded-lg border border-border bg-background px-2 py-1 text-sm">
                <option value="system">Системна</option><option value="light">Світла</option><option value="dark">Темна</option>
              </select>
            </div>
            <button onClick={handleLogout} className="mt-3 w-full rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20">Вийти</button>
          </div>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-lg px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-secondary"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          <h2 className="text-lg font-semibold">FinanceAI</h2><div className="w-8" />
        </header>
        <main className="p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
};
