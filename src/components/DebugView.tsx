import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const DebugView: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [shoppingLists, setShoppingLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Завантаження всіх даних для діагностики...');
      
      const [expRes, goalsRes, shopRes] = await Promise.all([
        api.getExpenses(),
        api.getGoals(),
        api.getShoppingLists()
      ]);
      
      console.log('📊 Витрати:', expRes);
      console.log('🎯 Цілі:', goalsRes);
      console.log('🛒 Списки покупок:', shopRes);
      
      setExpenses(expRes.expenses || []);
      setGoals(goalsRes.goals || []);
      setShoppingLists(shopRes.lists || []);
    } catch (err) {
      console.error('❌ Помилка завантаження:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🔧 Діагностика</h1>
        <button onClick={loadAllData} className="px-4 py-2 rounded-lg bg-primary text-white">
          Оновити
        </button>
      </div>
      
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
          ❌ Помилка: {error}
        </div>
      )}
      
      {/* Інформація про користувача */}
      <div className="p-4 rounded-xl bg-secondary/30">
        <h2 className="font-semibold mb-2">👤 Користувач</h2>
        <p className="text-sm">ID: {user?.id}</p>
        <p className="text-sm">Email: {user?.email}</p>
        <p className="text-sm">Ім'я: {user?.name}</p>
        <p className="text-sm">Токен: {api.getToken()?.substring(0, 30)}...</p>
      </div>
      
      {/* Списки покупок */}
      <div className="p-4 rounded-xl bg-secondary/30">
        <h2 className="font-semibold mb-2">🛒 Списки покупок ({shoppingLists.length})</h2>
        {shoppingLists.length === 0 ? (
          <p className="text-muted-foreground">Немає списків</p>
        ) : (
          <pre className="text-xs overflow-auto max-h-96 bg-black/20 p-2 rounded">
            {JSON.stringify(shoppingLists, null, 2)}
          </pre>
        )}
      </div>
      
      {/* Витрати */}
      <div className="p-4 rounded-xl bg-secondary/30">
        <h2 className="font-semibold mb-2">💰 Витрати та доходи ({expenses.length})</h2>
        {expenses.length === 0 ? (
          <p className="text-muted-foreground">Немає записів</p>
        ) : (
          <pre className="text-xs overflow-auto max-h-96 bg-black/20 p-2 rounded">
            {JSON.stringify(expenses, null, 2)}
          </pre>
        )}
      </div>
      
      {/* Цілі */}
      <div className="p-4 rounded-xl bg-secondary/30">
        <h2 className="font-semibold mb-2">🎯 Цілі ({goals.length})</h2>
        {goals.length === 0 ? (
          <p className="text-muted-foreground">Немає цілей</p>
        ) : (
          <pre className="text-xs overflow-auto max-h-96 bg-black/20 p-2 rounded">
            {JSON.stringify(goals, null, 2)}
          </pre>
        )}
      </div>
      
      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <h2 className="font-semibold mb-2">⚠️ Важливо</h2>
        <p className="text-sm">Якщо списки покупок з iOS додатку не відображаються тут, значить вони не синхронізовані з сервером. Переконайтеся, що в iOS додатку ви увійшли в той самий акаунт.</p>
      </div>
    </div>
  );
};
