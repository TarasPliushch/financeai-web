// src/components/expenses/ExpensesView.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Expense } from '../../types';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

export const ExpensesView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'expenses' | 'income'>('expenses');
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();

  const currency = user?.currency || '₴';

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await api.getExpenses();
      if (response.success) {
        const parsedExpenses = response.expenses.map((e: any) => ({
          ...e,
          date: new Date(e.date),
        }));
        setExpenses(parsedExpenses);
      }
    } catch (error) {
      toast.error('Помилка завантаження даних');
    } finally {
      setIsLoading(false);
    }
  };

  const displayedExpenses = expenses.filter(e => 
    selectedTab === 'expenses' ? !e.isIncome : e.isIncome
  ).sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalIncome = expenses.filter(e => e.isIncome).reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.filter(e => !e.isIncome).reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const handleDelete = async (expense: Expense) => {
    if (!confirm('Видалити запис?')) return;
    try {
      await api.deleteExpense(expense.serverId || expense.id);
      setExpenses(expenses.filter(e => e.id !== expense.id));
      toast.success('Видалено');
    } catch (error) {
      toast.error('Помилка видалення');
    }
  };

  const categoryEmoji = (category: string): string => {
    const map: Record<string, string> = {
      'Їжа': '🍔', 'Транспорт': '🚗', 'Розваги': '🎮', 'Здоров\'я': '💊',
      'Одяг': '👕', 'Освіта': '📚', 'Зарплата': '💼', 'Фріланс': '💻',
      'Інвестиції': '📈', 'Подарунки': '🎁', 'Комунальні': '🏠', 'Інше': '📦'
    };
    return map[category] || '💰';
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-secondary/50 backdrop-blur-sm border border-border">
          <p className="text-sm text-muted-foreground">Доходи</p>
          <p className="text-2xl font-bold text-green-500">
            +{currency}{totalIncome.toFixed(0)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/50 backdrop-blur-sm border border-border">
          <p className="text-sm text-muted-foreground">Витрати</p>
          <p className="text-2xl font-bold text-red-500">
            -{currency}{totalExpenses.toFixed(0)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/50 backdrop-blur-sm border border-border">
          <p className="text-sm text-muted-foreground">Баланс</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {currency}{balance.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setSelectedTab('expenses')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'expenses'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Витрати
        </button>
        <button
          onClick={() => setSelectedTab('income')}
          className={`px-4 py-2 font-medium transition-colors ${
            selectedTab === 'income'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Доходи
        </button>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90 transition-opacity"
        >
          <span className="text-xl">+</span>
          Додати
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {displayedExpenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-muted-foreground">Немає записів</p>
            <p className="text-sm text-muted-foreground">Натисніть + щоб додати</p>
          </div>
        ) : (
          displayedExpenses.map(expense => (
            <div
              key={expense.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 backdrop-blur-sm border border-border hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-2xl">
                {categoryEmoji(expense.category)}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{expense.title}</h3>
                <p className="text-sm text-muted-foreground">{expense.category}</p>
                <p className="text-xs text-muted-foreground">
                  {format(expense.date, 'dd MMM yyyy', { locale: uk })}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${expense.isIncome ? 'text-green-500' : 'text-red-500'}`}>
                  {expense.isIncome ? '+' : '-'}{currency}{expense.amount.toFixed(0)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(expense)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddExpenseModal
          isIncome={selectedTab === 'income'}
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            try {
              const response = await api.createExpense(data);
              if (response.success && response.expense) {
                const newExpense = {
                  ...response.expense,
                  date: new Date(response.expense.date),
                };
                setExpenses([...expenses, newExpense]);
                toast.success('Додано');
                setShowAddModal(false);
              }
            } catch (error) {
              toast.error('Помилка додавання');
            }
          }}
        />
      )}
    </div>
  );
};

// AddExpenseModal component
interface AddExpenseModalProps {
  isIncome: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isIncome, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(isIncome ? 'Зарплата' : 'Їжа');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const expenseCategories = ['Їжа', 'Транспорт', 'Розваги', 'Здоров\'я', 'Одяг', 'Освіта', 'Комунальні', 'Інше'];
  const incomeCategories = ['Зарплата', 'Фріланс', 'Інвестиції', 'Подарунки', 'Інше'];
  const categories = isIncome ? incomeCategories : expenseCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSave({
      title,
      amount: parseFloat(amount),
      category,
      date: new Date(date).toISOString(),
      notes: notes || undefined,
      isIncome,
    });
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">
            {isIncome ? 'Додати дохід' : 'Додати витрату'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Назва</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Сума</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Категорія</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Нотатки</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={2}
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
              {isLoading ? 'Збереження...' : 'Додати'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
