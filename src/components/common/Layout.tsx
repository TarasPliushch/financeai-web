import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const navigation = [
  { name: 'Фінанси', path: '/finances' },
  { name: 'Цілі', path: '/goals' },
  { name: 'Покупки', path: '/shopping' },
  { name: 'Чат', path: '/chat' },
  { name: 'Сповіщення', path: '/notifications' },
];

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  
  const [avatarDisplay, setAvatarDisplay] = useState<string>('👤');
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const avatar = user?.avatarEmoji;
    if (avatar) {
      if (avatar.startsWith('data:image') || avatar.startsWith('http')) {
        setAvatarImageUrl(avatar);
        setAvatarDisplay('📷');
      } else {
        setAvatarImageUrl(null);
        setAvatarDisplay(avatar);
      }
    } else {
      setAvatarImageUrl(null);
      setAvatarDisplay('👤');
    }
  }, [user?.avatarEmoji]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const goToProfile = () => { navigate('/profile'); setSidebarOpen(false); };

  const getDisplayName = () => {
    if (user?.name && user.name.length > 15) {
      return user.name.substring(0, 15) + '...';
    }
    return user?.name || 'Користувач';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-background border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b border-border">
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">FinanceAI</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-3 space-y-3">
            <button
              onClick={goToProfile}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center overflow-hidden">
                {avatarImageUrl ? (
                  <img src={avatarImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base">{avatarDisplay}</span>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground">Профіль</p>
              </div>
            </button>
            
            {/* Theme toggle */}
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm text-muted-foreground">Тема</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="bg-transparent border border-border rounded-lg px-2 py-1 text-sm focus:outline-none"
              >
                <option value="system">Системна</option>
                <option value="light">Світла</option>
                <option value="dark">Темна</option>
              </select>
            </div>
            
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <span className="text-lg">🚪</span>
              <span className="text-sm">Вийти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-lg px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-secondary">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-base font-semibold">FinanceAI</h2>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className={isChatPage ? 'h-[calc(100vh-56px)]' : 'p-4 lg:p-6'}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
