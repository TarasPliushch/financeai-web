import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  imageEmoji: string;
  notes?: string;
  deadline?: Date | null;
  currency: string;
  serverId?: string;
  progress: number;
  isCompleted: boolean;
  remaining: number;
}

export const GoalsView: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const currency = user?.currency || '₴';

  useEffect(() => { loadGoals(); }, []);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const response = await api.getGoals();
      if (response.success && response.goals) {
        const parsed = response.goals.map((g: any) => {
          let deadlineDate = null;
          if (g.deadline) {
            try { const parsedDate = new Date(g.deadline); if (!isNaN(parsedDate.getTime())) deadlineDate = parsedDate; } catch (e) {}
          }
          return {
            id: g.id, name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount,
            imageEmoji: g.imageEmoji || '💰', notes: g.notes, deadline: deadlineDate,
            currency: g.currency || '₴', serverId: g.id,
            progress: g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0,
            isCompleted: g.currentAmount >= g.targetAmount,
            remaining: Math.max(g.targetAmount - g.currentAmount, 0)
          };
        });
        setGoals(parsed);
      }
    } catch (error) { toast.error('Помилка завантаження цілей'); }
    finally { setIsLoading(false); }
  };

  const handleEdit = (goal: Goal) => setEditingGoal(goal);
  const handleDelete = async (goal: Goal) => {
    if (!confirm(`Видалити ціль "${goal.name}"?`)) return;
    try {
      await api.deleteGoal(goal.serverId || goal.id);
      setGoals(goals.filter(g => g.id !== goal.id));
      toast.success('Ціль видалено');
    } catch (error) { toast.error('Помилка видалення'); }
  };

  const handleUpdateProgress = async (goal: Goal, newAmount: number) => {
    try {
      await api.updateGoal(goal.serverId || goal.id, {
        name: goal.name, targetAmount: goal.targetAmount, currentAmount: newAmount,
        imageEmoji: goal.imageEmoji, notes: goal.notes, deadline: goal.deadline?.toISOString(),
        currency: goal.currency
      });
      const updated = goals.map(g => g.id === goal.id ? {
        ...g, currentAmount: newAmount, progress: newAmount / g.targetAmount,
        isCompleted: newAmount >= g.targetAmount, remaining: Math.max(g.targetAmount - newAmount, 0)
      } : g);
      setGoals(updated);
      toast.success('Прогрес оновлено');
    } catch (error) { toast.error('Помилка оновлення'); }
  };

  const handleAddGoal = async (data: any) => {
    try {
      const response = await api.createGoal(data);
      if (response.success && response.goal) {
        const newGoal: Goal = {
          id: response.goal.id, name: response.goal.name, targetAmount: response.goal.targetAmount,
          currentAmount: response.goal.currentAmount, imageEmoji: response.goal.imageEmoji || '💰',
          notes: response.goal.notes, deadline: response.goal.deadline ? new Date(response.goal.deadline) : null,
          currency: response.goal.currency || '₴', serverId: response.goal.id,
          progress: response.goal.targetAmount > 0 ? response.goal.currentAmount / response.goal.targetAmount : 0,
          isCompleted: response.goal.currentAmount >= response.goal.targetAmount,
          remaining: Math.max(response.goal.targetAmount - response.goal.currentAmount, 0)
        };
        setGoals([newGoal, ...goals]);
        toast.success(`Ціль "${data.name}" додано!`);
        setShowAddModal(false);
        return true;
      }
      toast.error(response?.error || 'Помилка додавання цілі');
      return false;
    } catch (error) { toast.error('Помилка додавання цілі'); return false; }
  };

  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return '';
    try { if (isNaN(date.getTime())) return ''; return format(date, 'dd MMM yyyy', { locale: uk }); } catch { return ''; }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Цілі</h1>
        <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90">+ Нова ціль</button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-muted-foreground">Немає цілей</p>
          <p className="text-sm text-muted-foreground mt-1">Натисніть + щоб додати нову ціль</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map(goal => (
            <div key={goal.id} className="goal-card cursor-pointer" onClick={() => setSelectedGoal(goal)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{goal.imageEmoji}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{goal.name}</h3>
                    {goal.notes && <p className="text-xs text-muted-foreground line-clamp-1">{goal.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(goal); }} className="p-1.5 rounded-lg hover:bg-secondary" title="Редагувати">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 3l4 4-7 7H10v-4l7-7z"/><path d="M4 20h16"/></svg>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(goal); }} className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors text-red-400" title="Видалити">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12"/><path d="M9 3h6"/></svg>
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{currency}{goal.currentAmount.toFixed(0)}</span>
                  <span className="text-muted-foreground">{currency}{goal.targetAmount.toFixed(0)}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${goal.isCompleted ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${goal.progress * 100}%` }} />
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span>{Math.round(goal.progress * 100)}%</span>
                  {!goal.isCompleted && <span>залишилось {currency}{goal.remaining.toFixed(0)}</span>}
                  {goal.deadline && <span>до {formatDate(goal.deadline)}</span>}
                </div>
              </div>
              {!goal.isCompleted && (
                <button onClick={(e) => { e.stopPropagation(); const val = prompt('Нова сума накопичень:', goal.currentAmount.toString()); if (val) handleUpdateProgress(goal, parseFloat(val)); }} className="mt-4 w-full py-2 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors">
                  + Додати накопичення
                </button>
              )}
              {goal.isCompleted && (
                <div className="mt-4 py-2 text-center text-green-500 bg-green-500/10 rounded-lg text-sm">🎉 Виконано!</div>
              )}
            </div>
          ))}
        </div>
      )}
      {showAddModal && <AddGoalModal onClose={() => setShowAddModal(false)} onSave={handleAddGoal} currency={currency} />}
      {editingGoal && <EditGoalModal goal={editingGoal} onClose={() => setEditingGoal(null)} onSave={async (data) => { await api.updateGoal(editingGoal.serverId || editingGoal.id, data); loadGoals(); setEditingGoal(null); }} />}
      {selectedGoal && <GoalDetailModal goal={selectedGoal} currency={currency} onClose={() => setSelectedGoal(null)} onUpdate={handleUpdateProgress} formatDate={formatDate} />}
    </div>
  );
};

// AddGoalModal, EditGoalModal, GoalDetailModal компоненти (залишаємо без змін, тільки додаємо класи)
const AddGoalModal: React.FC<{ onClose: () => void; onSave: (data: any) => void; currency: string }> = ({ onClose, onSave, currency }) => {
  const [name, setName] = useState(''); const [target, setTarget] = useState(''); const [current, setCurrent] = useState('0'); const [emoji, setEmoji] = useState('💰'); const [notes, setNotes] = useState(''); const [hasDeadline, setHasDeadline] = useState(false); const [deadline, setDeadline] = useState(''); const [isSaving, setIsSaving] = useState(false);
  const emojis = ['💰', '🏠', '🚗', '✈️', '📱', '💻', '🎓', '💍', '🎯', '🏋️', '📚', '🎮', '🌍', '🏖️', '💎'];
  React.useEffect(() => { if (hasDeadline && !deadline) { const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 30); setDeadline(tomorrow.toISOString().split('T')[0]); } }, [hasDeadline]);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!name.trim()) { toast.error('Введіть назву цілі'); return; } if (!target || parseFloat(target) <= 0) { toast.error('Введіть коректну суму'); return; } setIsSaving(true); await onSave({ name: name.trim(), targetAmount: parseFloat(target), currentAmount: parseFloat(current), imageEmoji: emoji, notes: notes.trim() || undefined, deadline: hasDeadline && deadline ? new Date(deadline).toISOString() : undefined, currency }); setIsSaving(false); };
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-md modal-content shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="p-5 border-b border-border flex justify-between items-center"><h2 className="text-xl font-semibold">Нова ціль</h2><button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">✕</button></div><form onSubmit={handleSubmit} className="p-5 space-y-4"><div><label className="text-sm font-medium">Іконка</label><div className="flex gap-2 flex-wrap mt-1">{emojis.map(e => (<button type="button" key={e} onClick={() => setEmoji(e)} className={`w-11 h-11 text-2xl rounded-xl transition-all ${emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary hover:bg-secondary/80'}`}>{e}</button>))}</div></div><input type="text" placeholder="Назва цілі" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" required /><input type="number" step="0.01" placeholder="Цільова сума" value={target} onChange={(e) => setTarget(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" required /><input type="number" step="0.01" placeholder="Вже накопичено" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" /><label className="flex items-center gap-2"><input type="checkbox" checked={hasDeadline} onChange={(e) => setHasDeadline(e.target.checked)} /><span>Встановити дедлайн</span></label>{hasDeadline && <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" />}<textarea placeholder="Нотатки" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" rows={2} /><div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary">Скасувати</button><button type="submit" disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90">{isSaving ? 'Додавання...' : 'Додати ціль'}</button></div></form></div></div>);
};

const EditGoalModal: React.FC<{ goal: Goal; onClose: () => void; onSave: (data: any) => void }> = ({ goal, onClose, onSave }) => {
  const [name, setName] = useState(goal.name); const [target, setTarget] = useState(goal.targetAmount.toString()); const [current, setCurrent] = useState(goal.currentAmount.toString()); const [emoji, setEmoji] = useState(goal.imageEmoji); const [notes, setNotes] = useState(goal.notes || ''); const [hasDeadline, setHasDeadline] = useState(!!goal.deadline); const [deadline, setDeadline] = useState(goal.deadline ? format(goal.deadline, 'yyyy-MM-dd') : ''); const [isSaving, setIsSaving] = useState(false);
  const emojis = ['💰', '🏠', '🚗', '✈️', '📱', '💻', '🎓', '💍', '🎯', '🏋️', '📚', '🎮', '🌍', '🏖️', '💎'];
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setIsSaving(true); await onSave({ name, targetAmount: parseFloat(target), currentAmount: parseFloat(current), imageEmoji: emoji, notes: notes || undefined, deadline: hasDeadline && deadline ? new Date(deadline).toISOString() : undefined, currency: goal.currency }); setIsSaving(false); };
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-md modal-content shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="p-5 border-b border-border flex justify-between items-center"><h2 className="text-xl font-semibold">Редагувати ціль</h2><button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">✕</button></div><form onSubmit={handleSubmit} className="p-5 space-y-4"><div><label className="text-sm font-medium">Іконка</label><div className="flex gap-2 flex-wrap mt-1">{emojis.map(e => (<button type="button" key={e} onClick={() => setEmoji(e)} className={`w-11 h-11 text-2xl rounded-xl transition-all ${emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary hover:bg-secondary/80'}`}>{e}</button>))}</div></div><input type="text" placeholder="Назва цілі" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" required /><input type="number" step="0.01" placeholder="Цільова сума" value={target} onChange={(e) => setTarget(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" required /><input type="number" step="0.01" placeholder="Накопичено" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" /><label className="flex items-center gap-2"><input type="checkbox" checked={hasDeadline} onChange={(e) => setHasDeadline(e.target.checked)} /><span>Встановити дедлайн</span></label>{hasDeadline && <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" />}<textarea placeholder="Нотатки" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background" rows={2} /><div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary">Скасувати</button><button type="submit" disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90">{isSaving ? 'Збереження...' : 'Зберегти'}</button></div></form></div></div>);
};

const GoalDetailModal: React.FC<{ goal: Goal; currency: string; onClose: () => void; onUpdate: (goal: Goal, amount: number) => void; formatDate: (date: Date | null | undefined) => string }> = ({ goal, currency, onClose, onUpdate, formatDate }) => {
  const [amount, setAmount] = useState(goal.currentAmount.toString());
  const handleUpdate = () => { const val = parseFloat(amount); if (!isNaN(val) && val >= 0 && val <= goal.targetAmount) { onUpdate(goal, val); onClose(); } else { toast.error('Введіть коректну суму'); } };
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-md modal-content shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="p-5 border-b border-border flex justify-between items-center"><div className="flex items-center gap-3"><span className="text-3xl">{goal.imageEmoji}</span><h2 className="text-xl font-semibold">{goal.name}</h2></div><button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">✕</button></div><div className="p-5 space-y-4"><div className="space-y-2"><div className="flex justify-between"><span className="text-muted-foreground">Накопичено</span><span className="font-semibold">{currency}{goal.currentAmount.toFixed(0)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Ціль</span><span className="font-semibold">{currency}{goal.targetAmount.toFixed(0)}</span></div><div className="h-3 bg-secondary rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${goal.isCompleted ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${goal.progress * 100}%` }} /></div><div className="flex justify-between text-sm"><span>{Math.round(goal.progress * 100)}%</span>{!goal.isCompleted && <span>залишилось {currency}{goal.remaining.toFixed(0)}</span>}</div></div>{goal.deadline && (<div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30"><span className="text-xl">📅</span><div><p className="text-xs text-muted-foreground">Дедлайн</p><p className="font-medium">{formatDate(goal.deadline)}</p></div></div>)}{goal.notes && (<div className="p-3 rounded-xl bg-secondary/30"><p className="text-xs text-muted-foreground mb-1">Нотатки</p><p className="text-sm">{goal.notes}</p></div>)}{!goal.isCompleted && (<div className="pt-2"><label className="block text-sm font-medium mb-2">Оновити накопичення</label><div className="flex gap-2"><input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50" /><button onClick={handleUpdate} className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90">Оновити</button></div></div>)}{goal.isCompleted && (<div className="text-center p-4 rounded-xl bg-green-500/10"><span className="text-2xl">🎉</span><p className="text-green-500 font-medium mt-1">Ціль досягнуто!</p></div>)}</div></div></div>);
};
