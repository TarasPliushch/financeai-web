import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Expense } from '../../types';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { ChartsView } from './ChartsView';

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'expenses' | 'income'>('expenses');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const { user } = useAuth();
  const currency = user?.currency || '₴';

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await api.getExpenses();
      if (response.success && response.expenses) {
        setExpenses(response.expenses.map((e: any) => ({ ...e, date: new Date(e.date) })));
      }
    } catch (error) { toast.error('Помилка завантаження'); }
    finally { setIsLoading(false); }
  };

  const displayedExpenses = expenses.filter(e => selectedTab === 'expenses' ? !e.isIncome : e.isIncome).sort((a, b) => b.date.getTime() - a.date.getTime());
  const totalIncome = expenses.filter(e => e.isIncome).reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.filter(e => !e.isIncome).reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const handleDelete = async (expense: Expense) => {
    if (!confirm('Видалити запис?')) return;
    try {
      await api.deleteExpense(expense.serverId || expense.id);
      setExpenses(expenses.filter(e => e.id !== expense.id));
      toast.success('Видалено');
    } catch (error) { toast.error('Помилка видалення'); }
  };

  const categoryEmoji = (cat: string): string => ({ 'Їжа': '🍔', 'Транспорт': '🚗', 'Розваги': '🎮', 'Здоров\'я': '💊', 'Одяг': '👕', 'Освіта': '📚', 'Зарплата': '💼', 'Фріланс': '💻', 'Інвестиції': '📈', 'Подарунки': '🎁', 'Комунальні': '🏠' }[cat] || '💰');

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  if (showCharts) return <ChartsView />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Фінанси</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowCharts(true)} className="px-3 py-2 rounded-lg bg-secondary/50 text-sm">📊 Діаграми</button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 rounded-xl bg-primary text-white">+ Додати</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-secondary/30"><p className="text-sm text-muted-foreground">Доходи</p><p className="text-2xl font-bold text-green-500">+{currency}{totalIncome.toFixed(0)}</p></div>
        <div className="p-4 rounded-xl bg-secondary/30"><p className="text-sm text-muted-foreground">Витрати</p><p className="text-2xl font-bold text-red-500">-{currency}{totalExpenses.toFixed(0)}</p></div>
        <div className="p-4 rounded-xl bg-secondary/30"><p className="text-sm text-muted-foreground">Баланс</p><p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{currency}{balance.toFixed(0)}</p></div>
      </div>
      <div className="flex gap-2 border-b border-border"><button onClick={() => setSelectedTab('expenses')} className={`px-4 py-2 ${selectedTab === 'expenses' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>Витрати</button><button onClick={() => setSelectedTab('income')} className={`px-4 py-2 ${selectedTab === 'income' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>Доходи</button></div>
      <div className="space-y-3">
        {displayedExpenses.length === 0 ? (<div className="text-center py-12"><div className="text-6xl mb-4">📭</div><p className="text-muted-foreground">Немає записів</p><p className="text-sm text-muted-foreground">Натисніть + щоб додати</p></div>) : (displayedExpenses.map(e => (<div key={e.id} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border"><div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">{categoryEmoji(e.category)}</div><div className="flex-1"><h3 className="font-medium">{e.title}</h3><p className="text-sm text-muted-foreground">{e.category}</p><p className="text-xs text-muted-foreground">{format(e.date, 'dd MMM yyyy', { locale: uk })}</p></div><div className="text-right"><p className={`font-semibold ${e.isIncome ? 'text-green-500' : 'text-red-500'}`}>{e.isIncome ? '+' : '-'}{currency}{e.amount.toFixed(0)}</p></div><button onClick={() => handleDelete(e)} className="p-2 text-muted-foreground hover:text-destructive">🗑️</button></div>)))}
      </div>
      {showAddModal && <AddExpenseModal isIncome={selectedTab === 'income'} onClose={() => setShowAddModal(false)} onSave={async (data) => { const res = await api.createExpense(data); if (res.success && res.expense) { setExpenses([...expenses, { ...res.expense, date: new Date(res.expense.date) }]); toast.success('Додано'); setShowAddModal(false); } }} />}
    </div>
  );
};

const AddExpenseModal: React.FC<{ isIncome: boolean; onClose: () => void; onSave: (data: any) => void }> = ({ isIncome, onClose, onSave }) => {
  const [title, setTitle] = useState(''); const [amount, setAmount] = useState(''); const [category, setCategory] = useState(isIncome ? 'Зарплата' : 'Їжа'); const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd')); const [notes, setNotes] = useState(''); const [isLoading, setIsLoading] = useState(false);
  const expenseCats = ['Їжа', 'Транспорт', 'Розваги', 'Здоров\'я', 'Одяг', 'Освіта', 'Комунальні', 'Інше']; const incomeCats = ['Зарплата', 'Фріланс', 'Інвестиції', 'Подарунки', 'Інше']; const cats = isIncome ? incomeCats : expenseCats;
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setIsLoading(true); onSave({ title, amount: parseFloat(amount), category, date: new Date(date).toISOString(), notes: notes || undefined, isIncome }); setIsLoading(false); };
  return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="w-full max-w-md rounded-2xl bg-background border border-border"><div className="p-4 border-b border-border flex justify-between"><h2 className="text-xl font-semibold">{isIncome ? 'Додати дохід' : 'Додати витрату'}</h2><button onClick={onClose}>✕</button></div><form onSubmit={handleSubmit} className="p-4 space-y-4"><input type="text" placeholder="Назва" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" required /><input type="number" step="0.01" placeholder="Сума" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" required /><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border">{cats.map(c => <option key={c}>{c}</option>)}</select><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" /><textarea placeholder="Нотатки" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border" rows={2} /><div className="flex gap-2"><button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-border">Скасувати</button><button type="submit" disabled={isLoading} className="flex-1 py-2 rounded-lg bg-primary text-white">{isLoading ? 'Збереження...' : 'Додати'}</button></div></form></div></div>);
};
