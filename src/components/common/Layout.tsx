import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Гарні іконки для навігації
const navigation = [
  { name: 'Фінанси', path: '/finances', icon: '💰', iconActive: '💎' },
  { name: 'Цілі', path: '/goals', icon: '🎯', iconActive: '🏆' },
  { name: 'Покупки', path: '/shopping', icon: '🛒', iconActive: '🛍️' },
  { name: 'Чат', path: '/chat', icon: '💬', iconActive: '💭' },
  { name: 'Сповіщення', path: '/notifications', icon: '🔔', iconActive: '🔔' },
];

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  
  // Стан для аватарки
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
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-gradient-to-b from-secondary/95 to-secondary/80 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-center border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🧠</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                FinanceAI
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-primary shadow-inner'
                      : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {({ isActive }) => isActive ? item.iconActive : item.icon}
                </span>
                <span>{item.name}</span>
                {({ isActive }) => isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                )}
              </NavLink>
            ))}
          </nav>

          {/* User Section - Avatar + Theme + Logout */}
          <div className="border-t border-white/10 p-4 space-y-3">
            {/* Avatar Button - перехід в профіль */}
            <button
              onClick={goToProfile}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center overflow-hidden shadow-lg">
                {avatarImageUrl ? (
                  <img src={avatarImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{avatarDisplay}</span>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">{getDisplayName()}</p>
                <p className="text-xs text-muted-foreground">Переглянути профіль</p>
              </div>
              <span className="text-muted-foreground group-hover:translate-x-1 transition-transform">→</span>
            </button>
            
            {/* Theme toggle */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎨</span>
                <span className="text-sm text-muted-foreground">Тема</span>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="bg-transparent border-none text-sm focus:outline-none cursor-pointer"
              >
                <option value="system">🌓 Системна</option>
                <option value="light">☀️ Світла</option>
                <option value="dark">🌙 Темна</option>
              </select>
            </div>
            
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 text-red-400"
            >
              <span className="text-xl">🚪</span>
              <span className="text-sm font-medium">Вийти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/10 bg-background/80 backdrop-blur-lg px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 hover:bg-white/10 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <span className="text-sm">🧠</span>
            </div>
            <h2 className="text-lg font-semibold">FinanceAI</h2>
          </div>
          <div className="w-8" />
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
