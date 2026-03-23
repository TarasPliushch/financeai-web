// src/components/goals/GoalsView.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SavingsGoal } from '../../types';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

export const GoalsView: React.FC = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const { user } = useAuth();

  const currency = user?.currency || '₴';

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const response = await api.getGoals();
      if (response.success) {
        const parsedGoals = response.goals.map((g: any) => ({
          ...g,
          deadline: g.deadline ? new Date(g.deadline) : undefined,
          progress: g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0,
          isCompleted: g.currentAmount >= g.targetAmount,
          remaining: Math.max(g.targetAmount - g.currentAmount, 0),
        }));
        setGoals(parsedGoals);
      }
    } catch (error) {
      toast.error('Помилка завантаження цілей');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (goal: SavingsGoal) => {
    if (!confirm(`Видалити ціль "${goal.name}"?`)) return;
    try {
      await api.deleteGoal(goal.serverId || goal.id);
      setGoals(goals.filter(g => g.id !== goal.id));
      toast.success('Ціль видалено');
    } catch (error) {
      toast.error('Помилка видалення');
    }
  };

  const handleUpdateProgress = async (goal: SavingsGoal, newAmount: number) => {
    if (newAmount < 0 || newAmount > goal.targetAmount) return;
    const updatedGoal = { ...goal, currentAmount: newAmount };
    try {
      await api.updateGoal(goal.serverId || goal.id, {
        currentAmount: newAmount,
        targetAmount: goal.targetAmount,
        name: goal.name,
        imageEmoji: goal.imageEmoji,
        currency: goal.currency,
        notes: goal.notes,
        deadline: goal.deadline?.toISOString(),
      });
      setGoals(goals.map(g => g.id === goal.id ? {
        ...updatedGoal,
        progress: newAmount / goal.targetAmount,
        isCompleted: newAmount >= goal.targetAmount,
        remaining: Math.max(goal.targetAmount - newAmount, 0),
      } : g));
      toast.success('Прогрес оновлено');
    } catch (error) {
      toast.error('Помилка оновлення');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Цілі</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90 transition-opacity"
        >
          <span className="text-xl">+</span>
          Нова ціль
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-muted-foreground">Немає цілей</p>
          <p className="text-sm text-muted-foreground">Натисніть + щоб додати нову ціль</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              currency={currency}
              onPress={() => setSelectedGoal(goal)}
              onDelete={() => handleDelete(goal)}
              onUpdateProgress={(amount) => handleUpdateProgress(goal, amount)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddGoalModal
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            try {
              const response = await api.createGoal(data);
              if (response.success && response.goal) {
                const newGoal = {
                  ...response.goal,
                  deadline: response.goal.deadline ? new Date(response.goal.deadline) : undefined,
                  progress: response.goal.targetAmount > 0 ? response.goal.currentAmount / response.goal.targetAmount : 0,
                  isCompleted: response.goal.currentAmount >= response.goal.targetAmount,
                  remaining: Math.max(response.goal.targetAmount - response.goal.currentAmount, 0),
                };
                setGoals([...goals, newGoal]);
                toast.success('Ціль додано');
                setShowAddModal(false);
              }
            } catch (error) {
              toast.error('Помилка додавання');
            }
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          currency={currency}
          onClose={() => setSelectedGoal(null)}
          onUpdateProgress={(amount) => handleUpdateProgress(selectedGoal, amount)}
        />
      )}
    </div>
  );
};

// GoalCard Component
interface GoalCardProps {
  goal: SavingsGoal;
  currency: string;
  onPress: () => void;
  onDelete: () => void;
  onUpdateProgress: (amount: number) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, currency, onPress, onDelete, onUpdateProgress }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(goal.currentAmount.toString());

  const progressPercent = Math.round(goal.progress * 100);
  const isCompleted = goal.isCompleted;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAmount = parseFloat(editAmount);
    if (!isNaN(newAmount) && newAmount >= 0 && newAmount <= goal.targetAmount) {
      onUpdateProgress(newAmount);
    }
    setIsEditing(false);
  };

  return (
    <div className="p-4 rounded-xl bg-secondary/30 backdrop-blur-sm border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
      <div onClick={onPress}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{goal.imageEmoji}</span>
            <div>
              <h3 className="font-semibold">{goal.name}</h3>
              {goal.notes && (
                <p className="text-xs text-muted-foreground line-clamp-1">{goal.notes}</p>
              )}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            🗑️
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {currency}{goal.currentAmount.toFixed(0)}
            </span>
            <span className="text-muted-foreground">
              {currency}{goal.targetAmount.toFixed(0)}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className={isCompleted ? 'text-green-500' : 'text-muted-foreground'}>
              {progressPercent}%
            </span>
            {!isCompleted && (
              <span className="text-muted-foreground">
                залишилось {currency}{goal.remaining.toFixed(0)}
              </span>
            )}
            {goal.deadline && (
              <span className="text-muted-foreground">
                до {format(goal.deadline, 'dd MMM', { locale: uk })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick edit */}
      {!isCompleted && (
        <div className="mt-3 pt-3 border-t border-border">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="flex-1 px-3 py-1 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 text-sm rounded-lg bg-primary text-white"
              >
                Зберегти
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-sm rounded-lg border border-border hover:bg-secondary"
              >
                Скас
              </button>
            </form>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="w-full text-sm text-primary hover:underline"
            >
              + Додати накопичення
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// AddGoalModal Component
interface AddGoalModalProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [emoji, setEmoji] = useState('💰');
  const [notes, setNotes] = useState('');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);

  const emojis = ['💰', '🏠', '🚗', '✈️', '📱', '💻', '🎓', '💍', '🎯', '🏋️', '📚', '🎮', '🌍', '🏖️', '💎'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) {
      toast.error('Заповніть назву та суму цілі');
      return;
    }
    setIsLoading(true);
    await onSave({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      imageEmoji: emoji,
      notes: notes || undefined,
      deadline: hasDeadline ? new Date(deadline).toISOString() : undefined,
      currency: '₴',
    });
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">Нова ціль</h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Emoji Picker */}
          <div>
            <label className="block text-sm font-medium mb-1">Іконка</label>
            <div className="flex gap-2 flex-wrap">
              {emojis.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 text-xl rounded-lg transition-all ${
                    emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Назва цілі</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Новий телефон, подорож, авто..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Цільова сума</label>
            <input
              type="number"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Вже накопичено</label>
            <input
              type="number"
              step="0.01"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasDeadline}
                onChange={(e) => setHasDeadline(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm font-medium">Встановити дедлайн</span>
            </label>
            {hasDeadline && (
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Нотатки (необов'язково)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={2}
              placeholder="Де купити, деталі..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? 'Збереження...' : 'Додати ціль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// GoalDetailModal Component
interface GoalDetailModalProps {
  goal: SavingsGoal;
  currency: string;
  onClose: () => void;
  onUpdateProgress: (amount: number) => void;
}

const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ goal, currency, onClose, onUpdateProgress }) => {
  const [editAmount, setEditAmount] = useState(goal.currentAmount.toString());

  const progressPercent = Math.round(goal.progress * 100);
  const isCompleted = goal.isCompleted;

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const newAmount = parseFloat(editAmount);
    if (!isNaN(newAmount) && newAmount >= 0 && newAmount <= goal.targetAmount) {
      onUpdateProgress(newAmount);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{goal.imageEmoji}</span>
            <h2 className="text-xl font-semibold">{goal.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Накопичено</span>
              <span className="font-semibold">{currency}{goal.currentAmount.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ціль</span>
              <span className="font-semibold">{currency}{goal.targetAmount.toFixed(0)}</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-green-500' : 'bg-primary'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className={isCompleted ? 'text-green-500' : 'text-muted-foreground'}>
                {progressPercent}%
              </span>
              {!isCompleted && (
                <span className="text-muted-foreground">
                  залишилось {currency}{goal.remaining.toFixed(0)}
                </span>
              )}
            </div>
          </div>

          {/* Deadline */}
          {goal.deadline && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-xs text-muted-foreground">Дедлайн</p>
                <p className="font-medium">{format(goal.deadline, 'dd MMMM yyyy', { locale: uk })}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {goal.notes && (
            <div className="p-3 rounded-lg bg-secondary/30">
              <p className="text-xs text-muted-foreground mb-1">Нотатки</p>
              <p className="text-sm">{goal.notes}</p>
            </div>
          )}

          {/* Update Progress Form */}
          {!isCompleted && (
            <form onSubmit={handleUpdate} className="pt-2">
              <label className="block text-sm font-medium mb-2">Оновити накопичення</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90"
                >
                  Оновити
                </button>
              </div>
            </form>
          )}

          {isCompleted && (
            <div className="text-center p-4 rounded-lg bg-green-500/10">
              <span className="text-2xl">🎉</span>
              <p className="text-green-500 font-medium mt-1">Ціль досягнуто!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
