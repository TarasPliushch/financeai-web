import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { PinSetupView } from '../auth/PinSetupView';

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
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FACode, setShow2FACode] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.avatarEmoji) {
      if (user.avatarEmoji.startsWith('data:image') || user.avatarEmoji.startsWith('http')) {
        setAvatarImageUrl(user.avatarEmoji);
        setEditAvatarEmoji('📷');
      } else {
        setEditAvatarEmoji(user.avatarEmoji);
        setAvatarImageUrl(null);
      }
    }
    checkBiometricAvailability();
    const savedBiometric = localStorage.getItem('biometricEnabled');
    setBiometricEnabled(savedBiometric === 'true');
    setTwoFactorEnabled(user?.twoFactorEnabled || false);
  }, [user]);

  const checkBiometricAvailability = async () => {
    try {
      if (window.PublicKeyCredential && 
          typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricAvailable(available);
      }
    } catch (error) {
      setBiometricAvailable(false);
    }
  };

  const handleBiometricToggle = async () => {
    if (!biometricEnabled) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        const publicKeyCredentialCreationOptions = {
          challenge: challenge,
          rp: { name: 'FinanceAI', id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(user?.id || 'user'),
            name: user?.email || '',
            displayName: user?.name || '',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        };
        
        const credential = await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions
        });
        
        if (credential) {
          localStorage.setItem('biometricCredentialId', (credential as any).id);
          localStorage.setItem('biometricEnabled', 'true');
          setBiometricEnabled(true);
          toast.success('Біометричну автентифікацію налаштовано!');
        }
      } catch (error) {
        console.error('Biometric setup error:', error);
        toast.error('Не вдалося налаштувати біометричну автентифікацію');
      }
    } else {
      localStorage.removeItem('biometricCredentialId');
      localStorage.setItem('biometricEnabled', 'false');
      setBiometricEnabled(false);
      toast.success('Біометричну автентифікацію вимкнено');
    }
  };

  const handle2FAToggle = async () => {
    if (!twoFactorEnabled) {
      setIsEnabling2FA(true);
      try {
        const response = await api.enable2FA();
        if (response.success) {
          setShow2FACode(true);
          toast.success('Код надіслано на ваш email');
          setIsEnabling2FA(false); // Важливо: скидаємо після отримання коду
        } else {
          toast.error(response.error || 'Помилка');
          setIsEnabling2FA(false);
        }
      } catch (error) {
        toast.error('Помилка надсилання коду');
        setIsEnabling2FA(false);
      }
    } else {
      try {
        const response = await api.disable2FA();
        if (response.success) {
          setTwoFactorEnabled(false);
          toast.success('2FA вимкнено');
        } else {
          toast.error(response.error || 'Помилка');
        }
      } catch (error) {
        toast.error('Помилка вимкнення 2FA');
      }
    }
  };

  const handleVerify2FACode = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error('Введіть 6-значний код');
      return;
    }
    setIsEnabling2FA(true);
    try {
      const response = await api.verify2FACode(twoFactorCode);
      if (response.success) {
        setTwoFactorEnabled(true);
        setShow2FACode(false);
        setTwoFactorCode('');
        toast.success('2FA увімкнено!');
      } else {
        toast.error(response.error || 'Невірний код');
      }
    } catch (error) {
      toast.error('Помилка верифікації');
    } finally {
      setIsEnabling2FA(false);
    }
  };

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
      const success = await updateProfile({ avatarEmoji: base64String });
      if (success) toast.success('Аватар оновлено');
      else toast.error('Помилка збереження аватара');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    let avatarData = editAvatarEmoji;
    if (avatarImageUrl) avatarData = avatarImageUrl;
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

  const faqItems = [
    { q: "Як синхронізуються мої дані між пристроями?", a: "Ваші дані автоматично синхронізуються з сервером при кожному вході. Достатньо увійти під своїм email на будь-якому пристрої." },
    { q: "Як встановити або змінити код безпеки?", a: "Перейдіть до розділу «Безпека» в налаштуваннях профілю. Вводите 6-значний PIN." },
    { q: "Чи можна використовувати Face ID замість коду?", a: "Так! Якщо ваш пристрій підтримує Face ID або Touch ID, увімкніть цю опцію в налаштуваннях безпеки." },
    { q: "Що таке двофакторна автентифікація?", a: "2FA додає додатковий рівень захисту. При вході вам буде надіслано код на email, який потрібно ввести для доступу." },
    { q: "Де зберігаються мої фінансові дані?", a: "Дані шифруються та зберігаються на захищеному сервері, прив'язаному до вашого акаунту." },
    { q: "Як AI Lis аналізує мої витрати?", a: "Lis аналізує всі витрати, доходи та цілі з вашого акаунту. Просто запитайте у чаті!" },
    { q: "Як встановити нагадування для списку покупок?", a: "При створенні або редагуванні списку увімкніть «Встановити нагадування», вкажіть дату й час." },
    { q: "Що робить AI Lis?", a: "Lis — персональний фінансовий помічник на базі DeepSeek AI. Аналізує витрати, шукає ціни, додає цілі та керує списками." },
    { q: "Як змінити тему або мову програми?", a: "У розділі «Налаштування» профілю оберіть тему та мову." }
  ];

  const emojis = ['👤', '😊', '🦁', '🐯', '🦊', '🐺', '🐻', '🐼', '🦋', '🌟', '💫', '🔥', '🎯', '🧑', '👨', '👩', '🧑‍💻'];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Profile Header Card */}
      <div className="rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/10 backdrop-blur-sm border border-border p-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-0.5">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                {avatarImageUrl ? (
                  <img src={avatarImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">{editAvatarEmoji}</span>
                )}
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white shadow-lg hover:scale-110 transition-transform"
              >
                ✏️
              </button>
            )}
          </div>
          {!isEditing ? (
            <>
              <h2 className="mt-4 text-2xl font-bold">{user?.name || 'Користувач'}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.description && <p className="mt-2 text-sm text-muted-foreground">{user?.description}</p>}
              <button onClick={() => setIsEditing(true)} className="mt-4 px-6 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                Редагувати профіль
              </button>
            </>
          ) : (
            <div className="w-full mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Фото профілю</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                      {avatarImageUrl ? (
                        <img src={avatarImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{editAvatarEmoji}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-4 py-2 rounded-xl border border-border hover:bg-secondary text-sm disabled:opacity-50">
                      {isUploading ? 'Завантаження...' : 'Завантажити фото'}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Або оберіть емодзі</label>
                <div className="flex gap-2 flex-wrap">
                  {emojis.map(e => (
                    <button key={e} onClick={() => { setEditAvatarEmoji(e); setAvatarImageUrl(null); }} className={`w-10 h-10 text-xl rounded-xl transition-all ${editAvatarEmoji === e && !avatarImageUrl ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary hover:bg-secondary/80'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ім'я</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Опис</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Про себе..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setIsEditing(false); }} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary">Скасувати</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90">{isSaving ? 'Збереження...' : 'Зберегти'}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Section */}
      <div className="rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/10 backdrop-blur-sm border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2"><span className="text-xl">⚙️</span> Налаштування</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
            <span className="flex items-center gap-2"><span className="text-lg">🌐</span> Мова</span>
            <select value={user?.language || 'uk'} onChange={async (e) => await updateProfile({ language: e.target.value })} className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm">
              <option value="uk">Українська</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
            <span className="flex items-center gap-2"><span className="text-lg">🎨</span> Тема</span>
            <select value={theme} onChange={(e) => setTheme(e.target.value as any)} className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm">
              <option value="system">🌓 Системна</option>
              <option value="light">☀️ Світла</option>
              <option value="dark">🌙 Темна</option>
            </select>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
            <span className="flex items-center gap-2"><span className="text-lg">💱</span> Валюта</span>
            <select value={user?.currency || '₴'} onChange={async (e) => await updateProfile({ currency: e.target.value })} className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm">
              <option value="₴">₴ Гривня</option>
              <option value="$">$ Долар</option>
              <option value="€">€ Євро</option>
            </select>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
            <span className="flex items-center gap-2"><span className="text-lg">🔔</span> Сповіщення</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={user?.notificationsEnabled !== false} onChange={async (e) => await updateProfile({ notificationsEnabled: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/10 backdrop-blur-sm border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2"><span className="text-xl">🔒</span> Безпека</h3>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
            <span className="flex items-center gap-2"><span className="text-lg">🔐</span> PIN-код</span>
            <button
              onClick={() => setShowPinSetup(true)}
              className="text-sm text-primary hover:underline"
            >
              {user?.pinHash ? 'Змінити PIN' : 'Встановити PIN'}
            </button>
          </div>
          
          {/* 2FA Toggle */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
            <span className="flex items-center gap-2">
              <span className="text-lg">🔑</span> Двофакторна автентифікація (2FA)
            </span>
            <div className="relative">
              {isEnabling2FA && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-full">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={handle2FAToggle}
                  disabled={isEnabling2FA}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
          
          {biometricAvailable && (
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
              <span className="flex items-center gap-2">
                <span className="text-lg">🖐️</span> Вхід за відбитком
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={biometricEnabled}
                  onChange={handleBiometricToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* 2FA Code Modal - ВИПРАВЛЕНО */}
      {show2FACode && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔐</span>
              </div>
              <h2 className="text-xl font-bold">Увімкнення 2FA</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Код підтвердження надіслано на ваш email
              </p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={twoFactorCode}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                setTwoFactorCode(val);
              }}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-widest py-3 rounded-xl border border-border bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShow2FACode(false);
                  setTwoFactorCode('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary"
              >
                Скасувати
              </button>
              <button
                onClick={handleVerify2FACode}
                disabled={twoFactorCode.length !== 6}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50"
              >
                Підтвердити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/10 backdrop-blur-sm border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2"><span className="text-xl">❓</span> Часті запитання</h3>
        </div>
        <div className="p-2">
          {faqItems.map((item, idx) => (
            <div key={idx} className="border-b border-border last:border-0">
              <button
                onClick={() => setExpandedFaq(expandedFaq === item.q ? null : item.q)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-medium">{item.q}</span>
                <span className="text-muted-foreground text-lg">{expandedFaq === item.q ? '−' : '+'}</span>
              </button>
              {expandedFaq === item.q && (
                <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/10 backdrop-blur-sm border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2"><span className="text-xl">ℹ️</span> Про програму</h3>
        </div>
        <div className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg">🧠</div>
          <div>
            <p className="font-semibold text-lg">FinanceAI</p>
            <p className="text-xs text-muted-foreground">Версія 1.0.0</p>
            <p className="text-xs text-muted-foreground mt-1">Особистий фінансовий помічник з AI аналізом</p>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/10 backdrop-blur-sm border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2"><span className="text-xl">📧</span> Підтримка</h3>
        </div>
        <a href="mailto:tarasplus502@gmail.com" className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors">
          <span className="text-2xl">📧</span>
          <div>
            <p className="font-medium">Написати розробнику</p>
            <p className="text-xs text-muted-foreground">tarasplus502@gmail.com</p>
          </div>
          <span className="ml-auto text-muted-foreground">→</span>
        </a>
      </div>

      {/* Logout Button */}
      <button onClick={() => { if (confirm('Ви впевнені, що хочете вийти?')) logout(); }} className="w-full py-3.5 rounded-xl bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 transition-colors">
        Вийти з акаунту
      </button>

      {/* PIN Setup Modal */}
      {showPinSetup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl">
            <PinSetupView
              mode={user?.pinHash ? 'change' : 'setup'}
              onSuccess={() => setShowPinSetup(false)}
              onCancel={() => setShowPinSetup(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
