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

  useEffect(() => { loadGoals(); }, []);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const response = await api.getGoals();
      if (response.success && response.goals) {
        const parsed = response.goals.map((g: any) => ({
          id: g.id,
          name: g.name,
          targetAmount: g.targetAmount,
          currentAmount: g.currentAmount,
          imageEmoji: g.imageEmoji || '💰',
          notes: g.notes,
          deadline: g.deadline ? new Date(g.deadline) : undefined,
          currency: g.currency || '₴',
          serverId: g.id,
          progress: g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0,
          isCompleted: g.currentAmount >= g.targetAmount,
          remaining: Math.max(g.targetAmount - g.currentAmount, 0),
        }));
        setGoals(parsed);
      }
    } catch (error) { toast.error('Помилка завантаження'); }
    finally { setIsLoading(false); }
  };

  const handleAddGoal = async (data: any) => {
    try {
      const response = await api.createGoal(data);
      if (response.success && response.goal) {
        const newGoal: SavingsGoal = {
          id: response.goal.id,
          name: response.goal.name,
          targetAmount: response.goal.targetAmount,
          currentAmount: response.goal.currentAmount,
          imageEmoji: response.goal.imageEmoji || '💰',
          notes: response.goal.notes,
          deadline: response.goal.deadline ? new Date(response.goal.deadline) : undefined,
          currency: response.goal.currency || '₴',
          serverId: response.goal.id,
          progress: response.goal.targetAmount > 0 ? response.goal.currentAmount / response.goal.targetAmount : 0,
          isCompleted: response.goal.currentAmount >= response.goal.targetAmount,
          remaining: Math.max(response.goal.targetAmount - response.goal.currentAmount, 0),
        };
        setGoals([newGoal, ...goals]);
        toast.success('Ціль додано');
        setShowAddModal(false);
      }
    } catch (error) { toast.error('Помилка додавання'); }
  };

  const handleUpdateGoal = async (goal: SavingsGoal, newAmount: number) => {
    try {
      await api.updateGoal(goal.serverId || goal.id, {
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: newAmount,
        imageEmoji: goal.imageEmoji,
        notes: goal.notes,
        deadline: goal.deadline?.toISOString(),
        currency: goal.currency,
      });
      const updated = goals.map(g => g.id === goal.id ? { ...g, currentAmount: newAmount, progress: newAmount / g.targetAmount, isCompleted: newAmount >= g.targetAmount, remaining: Math.max(g.targetAmount - newAmount, 0) } : g);
      setGoals(updated);
      toast.success('Прогрес оновлено');
    } catch (error) { toast.error('Помилка оновлення'); }
  };

  const handleDeleteGoal = async (goal: SavingsGoal) => {
    if (!confirm(`Видалити ціль "${goal.name}"?`)) return;
    try {
      await api.deleteGoal(goal.serverId || goal.id);
      setGoals(goals.filter(g => g.id !== goal.id));
      toast.success('Ціль видалено');
    } catch (error) { toast.error('Помилка видалення'); }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Цілі</h1>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white">+ Нова ціль</button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12"><div className="text-6xl mb-4">🎯</div><p className="text-muted-foreground">Немає цілей</p><p className="text-sm text-muted-foreground">Натисніть + щоб додати нову ціль</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => (
            <div key={goal.id} className="p-4 rounded-xl bg-secondary/30 border border-border cursor-pointer hover:bg-secondary/50" onClick={() => setSelectedGoal(goal)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><span className="text-3xl">{goal.imageEmoji}</span><div><h3 className="font-semibold">{goal.name}</h3>{goal.notes && <p className="text-xs text-muted-foreground line-clamp-1">{goal.notes}</p>}</div></div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal); }} className="p-1 text-muted-foreground hover:text-destructive">🗑️</button>
              </div>
              <div className="mt-3"><div className="flex justify-between text-sm"><span>{currency}{goal.currentAmount.toFixed(0)}</span><span>{currency}{goal.targetAmount.toFixed(0)}</span></div><div className="h-2 bg-secondary rounded-full mt-1"><div className={`h-full rounded-full ${goal.isCompleted ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${goal.progress * 100}%` }} /></div><div className="flex justify-between text-xs mt-1"><span>{Math.round(goal.progress * 100)}%</span>{!goal.isCompleted && <span>залишилось {currency}{goal.remaining.toFixed(0)}</span>}{goal.deadline && <span>до {format(goal.deadline, 'dd MMM', { locale: uk })}</span>}</div></div>
              {!goal.isCompleted && <button onClick={(e) => { e.stopPropagation(); const newAmount = prompt('Нова сума накопичень:', goal.currentAmount.toString()); if (newAmount) handleUpdateGoal(goal, parseFloat(newAmount)); }} className="mt-3 w-full text-sm text-primary hover:underline">+ Додати накопичення</button>}
            </div>
          ))}
        </div>
      )}

      {showAddModal && <AddGoalModal onClose={() => setShowAddModal(false)} onSave={handleAddGoal} currency={currency} />}
      {selectedGoal && <GoalDetailModal goal={selectedGoal} currency={currency} onClose={() => setSelectedGoal(null)} onUpdate={handleUpdateGoal} />}
    </div>
  );
};

const AddGoalModal: React.FC<{ onClose: () => void; onSave: (data: any) => void; currency: string }> = ({ onClose, onSave, currency }) => {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [emoji, setEmoji] = useState('💰');
  const [notes, setNotes] = useState('');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const emojis = ['💰', '🏠', '🚗', '✈️', '📱', '💻', '🎓', '💍', '🎯', '🏋️', '📚', '🎮', '🌍', '🏖️', '💎'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) { toast.error('Заповніть назву та суму'); return; }
    onSave({ name, targetAmount: parseFloat(target), currentAmount: parseFloat(current), imageEmoji: emoji, notes: notes || undefined, deadline: hasDeadline ? new Date(deadline).toISOString() : undefined, currency });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-background border border-border">
        <div className="p-4 border-b border-border flex justify-between"><h2 className="text-xl font-semibold">Нова ціль</h2><button onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div><label className="text-sm">Іконка</label><div className="flex gap-2 flex-wrap mt-1">{emojis.map(e => (<button type="button" key={e} onClick={() => setEmoji(e)} className={`w-10 h-10 text-xl rounded-lg ${emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary'}`}>{e}</button>))}</div></div>
          <input type="text" placeholder="Назва цілі" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" required />
          <input type="number" step="0.01" placeholder="Цільова сума" value={target} onChange={(e) => setTarget(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" required />
          <input type="number" step="0.01" placeholder="Вже накопичено" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" />
          <label className="flex items-center gap-2"><input type="checkbox" checked={hasDeadline} onChange={(e) => setHasDeadline(e.target.checked)} /><span>Встановити дедлайн</span></label>
          {hasDeadline && <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" />}
          <textarea placeholder="Нотатки" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" rows={2} />
          <button type="submit" className="w-full py-2 rounded-lg bg-primary text-white">Додати ціль</button>
        </form>
      </div>
    </div>
  );
};

const GoalDetailModal: React.FC<{ goal: SavingsGoal; currency: string; onClose: () => void; onUpdate: (goal: SavingsGoal, amount: number) => void }> = ({ goal, currency, onClose, onUpdate }) => {
  const [amount, setAmount] = useState(goal.currentAmount.toString());
  const handleUpdate = () => { const val = parseFloat(amount); if (!isNaN(val) && val >= 0 && val <= goal.targetAmount) onUpdate(goal, val); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-background border border-border">
        <div className="p-4 border-b border-border flex justify-between"><div className="flex items-center gap-2"><span className="text-3xl">{goal.imageEmoji}</span><h2 className="text-xl font-semibold">{goal.name}</h2></div><button onClick={onClose}>✕</button></div>
        <div className="p-4 space-y-4">
          <div className="space-y-2"><div className="flex justify-between"><span>Накопичено</span><span className="font-semibold">{currency}{goal.currentAmount.toFixed(0)}</span></div><div className="flex justify-between"><span>Ціль</span><span className="font-semibold">{currency}{goal.targetAmount.toFixed(0)}</span></div><div className="h-2 bg-secondary rounded-full"><div className="h-full rounded-full bg-primary" style={{ width: `${goal.progress * 100}%` }} /></div><div className="flex justify-between"><span>{Math.round(goal.progress * 100)}%</span>{!goal.isCompleted && <span>залишилось {currency}{goal.remaining.toFixed(0)}</span>}</div></div>
          {goal.deadline && <div className="p-3 rounded-lg bg-secondary/30">📅 {format(goal.deadline, 'dd MMMM yyyy', { locale: uk })}</div>}
          {goal.notes && <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground">Нотатки</p><p className="text-sm">{goal.notes}</p></div>}
          {!goal.isCompleted && <div><label className="text-sm">Оновити накопичення</label><div className="flex gap-2 mt-1"><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-border" /><button onClick={handleUpdate} className="px-4 py-2 rounded-lg bg-primary text-white">Оновити</button></div></div>}
          {goal.isCompleted && <div className="text-center p-4 rounded-lg bg-green-500/10"><span className="text-2xl">🎉</span><p className="text-green-500">Ціль досягнуто!</p></div>}
        </div>
      </div>
    </div>
  );
};
