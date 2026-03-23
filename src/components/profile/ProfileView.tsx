// src/components/profile/ProfileView.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';

export const ProfileView: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editDescription, setEditDescription] = useState(user?.description || '');
  const [editAvatarEmoji, setEditAvatarEmoji] = useState(user?.avatarEmoji || '👤');
  const [isSaving, setIsSaving] = useState(false);

  const emojis = ['👤', '😊', '🦁', '🐯', '🦊', '🐺', '🐻', '🐼', '🦋', '🌟', '💫', '🔥', '🎯', '🧑', '👨', '👩'];

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateProfile({
      name: editName,
      description: editDescription,
      avatarEmoji: editAvatarEmoji,
    });
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Ви впевнені, що хочете вийти?')) {
      logout();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile Card */}
      <div className="rounded-xl bg-secondary/30 backdrop-blur-sm border border-border p-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-5xl">
              {user?.avatarEmoji || '👤'}
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white shadow-lg"
              >
                ✏️
              </button>
            )}
          </div>

          {/* Name */}
          {!isEditing ? (
            <>
              <h2 className="mt-4 text-xl font-bold">{user?.name || 'Користувач'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.description && (
                <p className="mt-2 text-sm text-muted-foreground max-w-md">{user?.description}</p>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
              >
                Редагувати профіль
              </button>
            </>
          ) : (
            <div className="w-full mt-4 space-y-3">
              {/* Avatar Emoji Picker */}
              <div>
                <label className="block text-sm font-medium mb-1">Аватар</label>
                <div className="flex gap-2 flex-wrap">
                  {emojis.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEditAvatarEmoji(e)}
                      className={`w-10 h-10 text-xl rounded-lg transition-all ${
                        editAvatarEmoji === e
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ім'я</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Опис</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={2}
                  placeholder="Про себе..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-lg border border-border hover:bg-secondary"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editName.trim()}
                  className="flex-1 py-2 rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? 'Збереження...' : 'Зберегти'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Card */}
      <div className="rounded-xl bg-secondary/30 backdrop-blur-sm border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Налаштування</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Language */}
          <div className="flex justify-between items-center">
            <span className="text-sm">Мова</span>
            <select
              value={user?.language || 'uk'}
              onChange={async (e) => {
                await updateProfile({ language: e.target.value });
              }}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
            >
              <option value="uk">Українська</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Theme */}
          <div className="flex justify-between items-center">
            <span className="text-sm">Тема</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
            >
              <option value="system">Системна</option>
              <option value="light">Світла</option>
              <option value="dark">Темна</option>
            </select>
          </div>

          {/* Currency */}
          <div className="flex justify-between items-center">
            <span className="text-sm">Валюта</span>
            <select
              value={user?.currency || '₴'}
              onChange={async (e) => {
                await updateProfile({ currency: e.target.value });
              }}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
            >
              <option value="₴">₴ (Гривня)</option>
              <option value="$">$ (Долар)</option>
              <option value="€">€ (Євро)</option>
              <option value="£">£ (Фунт)</option>
            </select>
          </div>

          {/* Notifications */}
          <div className="flex justify-between items-center">
            <span className="text-sm">Сповіщення</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={user?.notificationsEnabled !== false}
                onChange={async (e) => {
                  await updateProfile({ notificationsEnabled: e.target.checked });
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* About Card */}
      <div className="rounded-xl bg-secondary/30 backdrop-blur-sm border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Про програму</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-2xl">
              🧠
            </div>
            <div>
              <p className="font-semibold">FinanceAI</p>
              <p className="text-xs text-muted-foreground">Версія 1.0.0</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Особистий фінансовий помічник з AI аналізом, списками покупок та управлінням цілями.
          </p>
          <p className="text-xs text-muted-foreground">
            AI на базі DeepSeek
          </p>
        </div>
      </div>

      {/* FAQ Card */}
      <div className="rounded-xl bg-secondary/30 backdrop-blur-sm border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Часті запитання</h3>
        </div>
        <div className="p-4 space-y-3">
          <FAQItem
            question="Як синхронізуються мої дані?"
            answer="Ваші дані автоматично синхронізуються з сервером при кожному вході. Достатньо увійти під своїм email на будь-якому пристрої."
          />
          <FAQItem
            question="Де зберігаються мої фінансові дані?"
            answer="Дані шифруються та зберігаються на захищеному сервері, прив'язаному до вашого акаунту. Локальна копія зберігається для швидкого доступу."
          />
          <FAQItem
            question="Як AI аналізує мої витрати?"
            answer="Lis аналізує всі витрати, доходи та цілі з вашого акаунту. Запитайте: 'Скільки я витратив цього місяця?' або 'Коли зможу накопичити на телефон?'"
          />
          <FAQItem
            question="Як встановити нагадування для списку покупок?"
            answer="При створенні або редагуванні списку увімкніть 'Встановити нагадування', вкажіть дату й час, виберіть за скільки хвилин нагадати."
          />
        </div>
      </div>

      {/* Support Card */}
      <div className="rounded-xl bg-secondary/30 backdrop-blur-sm border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Підтримка</h3>
        </div>
        <div className="p-4">
          <a
            href="mailto:tarasplus502@gmail.com"
            className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <span className="text-2xl">📧</span>
            <div>
              <p className="font-medium">Написати розробнику</p>
              <p className="text-xs text-muted-foreground">tarasplus502@gmail.com</p>
            </div>
            <span className="ml-auto">→</span>
          </a>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors"
      >
        Вийти з акаунту
      </button>
    </div>
  );
};

// FAQItem Component
interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center py-2 text-left"
      >
        <span className="text-sm font-medium">{question}</span>
        <span className="text-muted-foreground">{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <p className="text-xs text-muted-foreground pb-2 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
};
