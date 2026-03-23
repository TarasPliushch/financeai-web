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
