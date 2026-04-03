import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Expense } from '../../types';
import { api } from '../../services/api';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
}

interface ChartsViewProps {
  onBack?: () => void;
}

export const ChartsView: React.FC<ChartsViewProps> = ({ onBack }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [rangeMonths, setRangeMonths] = useState(3);
  const { user } = useAuth();

  const currency = user?.currency || '₴';
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7CB5EC', '#90ED7D', '#F7A35C'];

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    try {
      const response = await api.getExpenses();
      if (response.success) {
        setExpenses(response.expenses.map((e: any) => ({ ...e, date: new Date(e.date) })));
      }
    } catch (error) { console.error('Failed to load expenses'); }
    finally { setIsLoading(false); }
  };

  const getFilteredExpenses = (isIncome: boolean) => {
    let filtered = expenses.filter(e => e.isIncome === isIncome);
    if (rangeMonths > 0) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - rangeMonths);
      filtered = filtered.filter(e => e.date >= cutoff);
    }
    return filtered;
  };

  const getCategoryData = (isIncome: boolean): ChartDataPoint[] => {
    const filtered = getFilteredExpenses(isIncome);
    const totals: Record<string, number> = {};
    filtered.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
    return Object.entries(totals).map(([label, value], idx) => ({ label, value, color: colors[idx % colors.length] }));
  };

  const getMonthlyData = () => {
    const months = rangeMonths > 0 ? rangeMonths : 6;
    const result: { month: string; income: number; expense: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleString('uk', { month: 'short' });
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const monthExpenses = expenses.filter(e => e.date >= start && e.date < end);
      result.push({
        month: monthName,
        income: monthExpenses.filter(e => e.isIncome).reduce((s, e) => s + e.amount, 0),
        expense: monthExpenses.filter(e => !e.isIncome).reduce((s, e) => s + e.amount, 0),
      });
    }
    return result;
  };

  const expenseData = getCategoryData(false);
  const incomeData = getCategoryData(true);
  const monthlyData = getMonthlyData();
  const totalExpenses = expenseData.reduce((s, d) => s + d.value, 0);
  const totalIncome = incomeData.reduce((s, d) => s + d.value, 0);
  const balance = totalIncome - totalExpenses;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  const pieChartOptions = { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' as const } } };
  const barChartOptions = { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' as const } }, scales: { y: { beginAtZero: true, title: { display: true, text: `${currency}` } } } };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Кнопка назад */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Назад</span>
      </button>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
          <p className="text-sm text-muted-foreground">Доходи</p>
          <p className="text-2xl font-bold text-green-500">+{currency}{totalIncome.toFixed(0)}</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
          <p className="text-sm text-muted-foreground">Витрати</p>
          <p className="text-2xl font-bold text-red-500">-{currency}{totalExpenses.toFixed(0)}</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground">Баланс</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{currency}{balance.toFixed(0)}</p>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <button onClick={() => setRangeMonths(1)} className={`px-3 py-1 rounded-lg text-sm transition-colors ${rangeMonths === 1 ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80'}`}>1М</button>
        <button onClick={() => setRangeMonths(3)} className={`px-3 py-1 rounded-lg text-sm transition-colors ${rangeMonths === 3 ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80'}`}>3М</button>
        <button onClick={() => setRangeMonths(6)} className={`px-3 py-1 rounded-lg text-sm transition-colors ${rangeMonths === 6 ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80'}`}>6М</button>
        <button onClick={() => setRangeMonths(12)} className={`px-3 py-1 rounded-lg text-sm transition-colors ${rangeMonths === 12 ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80'}`}>1Р</button>
        <button onClick={() => setRangeMonths(0)} className={`px-3 py-1 rounded-lg text-sm transition-colors ${rangeMonths === 0 ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80'}`}>Все</button>
      </div>

      <div className="flex gap-2 justify-center">
        <button onClick={() => setChartType('pie')} className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${chartType === 'pie' ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12 12 2"/></svg>
          Кругова
        </button>
        <button onClick={() => setChartType('bar')} className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${chartType === 'bar' ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16"/><path d="M6 16v4"/><path d="M10 12v8"/><path d="M14 8v12"/><path d="M18 4v16"/></svg>
          Графік
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="font-semibold mb-4 text-center">Витрати за категоріями</h3>
          <div className="h-64">
            {expenseData.length ? (chartType === 'pie' ? <Pie data={{ labels: expenseData.map(d => d.label), datasets: [{ data: expenseData.map(d => d.value), backgroundColor: expenseData.map(d => d.color), borderWidth: 0 }] }} options={pieChartOptions} /> : <Bar data={{ labels: expenseData.map(d => d.label), datasets: [{ label: `${currency}`, data: expenseData.map(d => d.value), backgroundColor: expenseData.map(d => d.color) }] }} options={barChartOptions} />) : <div className="text-center text-muted-foreground">Немає даних</div>}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="font-semibold mb-4 text-center">Доходи за категоріями</h3>
          <div className="h-64">
            {incomeData.length ? (chartType === 'pie' ? <Pie data={{ labels: incomeData.map(d => d.label), datasets: [{ data: incomeData.map(d => d.value), backgroundColor: incomeData.map(d => d.color), borderWidth: 0 }] }} options={pieChartOptions} /> : <Bar data={{ labels: incomeData.map(d => d.label), datasets: [{ label: `${currency}`, data: incomeData.map(d => d.value), backgroundColor: incomeData.map(d => d.color) }] }} options={barChartOptions} />) : <div className="text-center text-muted-foreground">Немає даних</div>}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border">
        <h3 className="font-semibold mb-4 text-center">Динаміка доходів та витрат</h3>
        <div className="h-80">
          <Bar data={{ labels: monthlyData.map(d => d.month), datasets: [{ label: 'Доходи', data: monthlyData.map(d => d.income), backgroundColor: '#4BC0C0' }, { label: 'Витрати', data: monthlyData.map(d => d.expense), backgroundColor: '#FF6384' }] }} options={barChartOptions} />
        </div>
      </div>
    </div>
  );
};
