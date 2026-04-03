import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export const ProfileView: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editDescription, setEditDescription] = useState(user?.description || '');
  const [editAvatarEmoji, setEditAvatarEmoji] = useState(user?.avatarEmoji || '👤');
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Завантажуємо аватар з профілю користувача
    if (user?.avatarEmoji) {
      if (user.avatarEmoji.startsWith('data:image') || user.avatarEmoji.startsWith('http')) {
        setAvatarImageUrl(user.avatarEmoji);
        setEditAvatarEmoji('📷');
      } else {
        setEditAvatarEmoji(user.avatarEmoji);
        setAvatarImageUrl(null);
      }
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Будь ласка, оберіть зображення');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл не більше 5MB');
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setAvatarImageUrl(base64String);
      setEditAvatarEmoji('📷');
      
      // Відправляємо на сервер через updateProfile
      const success = await updateProfile({ avatarEmoji: base64String });
      if (success) {
        toast.success('Аватар оновлено');
      } else {
        toast.error('Помилка збереження аватара');
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    let avatarData = editAvatarEmoji;
    
    if (avatarImageUrl) {
      avatarData = avatarImageUrl;
    }
    
    const success = await updateProfile({
      name: editName,
      description: editDescription,
      avatarEmoji: avatarData,
    });
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
      toast.success('Профіль оновлено');
    }
  };

  const emojis = ['👤', '😊', '🦁', '🐯', '🦊', '🐺', '🐻', '🐼', '🦋', '🌟', '💫', '🔥', '🎯', '🧑', '👨', '👩', '🧑‍💻'];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
              {avatarImageUrl ? (
                <img src={avatarImageUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">{editAvatarEmoji}</span>
              )}
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white shadow-lg hover:opacity-90 transition-opacity"
              >
                ✏️
              </button>
            )}
          </div>

          {!isEditing ? (
            <>
              <h2 className="mt-4 text-xl font-bold">{user?.name || 'Користувач'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.description && (
                <p className="mt-2 text-sm text-muted-foreground max-w-md">{user?.description}</p>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-5 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                Редагувати профіль
              </button>
            </>
          ) : (
            <div className="w-full mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Фото профілю</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {avatarImageUrl ? (
                      <img src={avatarImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{editAvatarEmoji}</span>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 py-2 rounded-xl border border-border hover:bg-secondary transition-colors text-sm disabled:opacity-50"
                    >
                      {isUploading ? 'Завантаження...' : 'Завантажити фото'}
                    </button>
                    {avatarImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarImageUrl(null);
                          setEditAvatarEmoji('👤');
                          updateProfile({ avatarEmoji: '👤' });
                        }}
                        className="ml-2 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Видалити
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Максимум 5MB, JPG/PNG</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Або оберіть емодзі</label>
                <div className="flex gap-2 flex-wrap">
                  {emojis.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => {
                        setEditAvatarEmoji(e);
                        setAvatarImageUrl(null);
                      }}
                      className={`w-10 h-10 text-xl rounded-xl transition-all ${editAvatarEmoji === e && !avatarImageUrl ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary hover:bg-secondary/80'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ім'я</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Опис</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  placeholder="Про себе..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors"
                >
                  Скасувати
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? 'Збереження...' : 'Зберегти'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Налаштування</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Мова</span>
            <select
              value={user?.language || 'uk'}
              onChange={async (e) => { await updateProfile({ language: e.target.value }); }}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
            >
              <option value="uk">Українська</option>
              <option value="en">English</option>
            </select>
          </div>
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
          <div className="flex justify-between items-center">
            <span className="text-sm">Валюта</span>
            <select
              value={user?.currency || '₴'}
              onChange={async (e) => { await updateProfile({ currency: e.target.value }); }}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm"
            >
              <option value="₴">₴ (Гривня)</option>
              <option value="$">$ (Долар)</option>
              <option value="€">€ (Євро)</option>
            </select>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Сповіщення</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={user?.notificationsEnabled !== false}
                onChange={async (e) => { await updateProfile({ notificationsEnabled: e.target.checked }); }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      <button
        onClick={() => { if (confirm('Ви впевнені, що хочете вийти?')) logout(); }}
        className="w-full py-3 rounded-xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors"
      >
        Вийти з акаунту
      </button>
    </div>
  );
};
