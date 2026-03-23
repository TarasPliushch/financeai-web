// src/components/notifications/NotificationsView.tsx
import React, { useState, useEffect } from 'react';
import { AppNotification } from '../../types';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.getNotifications();
      if (response.success && response.notifications) {
        const parsed = response.notifications.map((n: any) => ({
          ...n,
          date: new Date(n.date),
        }));
        setNotifications(parsed);
      }
    } catch (error) {
      toast.error('Помилка завантаження сповіщень');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('Всі сповіщення позначено прочитаними');
    } catch (error) {
      toast.error('Помилка');
    }
  };

  const handleDelete = async (notification: AppNotification) => {
    try {
      await api.deleteNotification(notification.id);
      setNotifications(notifications.filter(n => n.id !== notification.id));
      toast.success('Видалено');
    } catch (error) {
      toast.error('Помилка видалення');
    }
  };

  const handleMarkRead = async (notification: AppNotification) => {
    if (notification.isRead) return;
    try {
      await api.markAllNotificationsRead(); // API doesn't have single mark read
      setNotifications(notifications.map(n =>
        n.id === notification.id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      // silent fail
    }
  };

  const getIcon = (type: string): string => {
    switch (type) {
      case 'expenseAdded':
      case 'expenseEdited':
        return '💸';
      case 'incomeAdded':
      case 'incomeEdited':
        return '💰';
      case 'goalAdded':
        return '🎯';
      case 'goalCompleted':
        return '🏆';
      case 'goalProgress':
      case 'goalEdited':
        return '📈';
      default:
        return '🔔';
    }
  };

  const getColor = (type: string): string => {
    switch (type) {
      case 'expenseAdded':
      case 'expenseEdited':
        return 'text-red-500';
      case 'incomeAdded':
      case 'incomeEdited':
        return 'text-green-500';
      case 'goalCompleted':
        return 'text-green-500';
      default:
        return 'text-primary';
    }
  };

  const groupByDate = (notifs: AppNotification[]): { date: string; items: AppNotification[] }[] => {
    const groups: Record<string, AppNotification[]> = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifs.forEach(notif => {
      const date = notif.date;
      let key = '';
      if (date.toDateString() === today.toDateString()) {
        key = 'Сьогодні';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Вчора';
      } else {
        key = format(date, 'dd MMMM yyyy', { locale: uk });
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(notif);
    });

    return Object.entries(groups)
      .map(([date, items]) => ({ date, items: items.sort((a, b) => b.date.getTime() - a.date.getTime()) }))
      .sort((a, b) => {
        if (a.date === 'Сьогодні') return -1;
        if (b.date === 'Сьогодні') return 1;
        if (a.date === 'Вчора') return -1;
        if (b.date === 'Вчора') return 1;
        return b.items[0]?.date.getTime() - a.items[0]?.date.getTime();
      });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const grouped = groupByDate(notifications);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Сповіщення</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} непрочитаних
            </p>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-primary hover:underline"
          >
            Позначити всі прочитаними
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔕</div>
          <p className="text-muted-foreground">Немає сповіщень</p>
          <p className="text-sm text-muted-foreground">
            Тут з'являться сповіщення про ваші дії
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                {group.date}
              </h3>
              <div className="space-y-2">
                {group.items.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkRead(notif)}
                    className={`flex items-start gap-3 p-4 rounded-xl transition-colors cursor-pointer ${
                      notif.isRead
                        ? 'bg-secondary/30 border border-border'
                        : 'bg-primary/5 border border-primary/20'
                    }`}
                  >
                    <div className={`text-2xl ${getColor(notif.type)}`}>
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className={`font-medium ${!notif.isRead && 'text-primary'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(notif.date, { addSuffix: true, locale: uk })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notif.body}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notif);
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
