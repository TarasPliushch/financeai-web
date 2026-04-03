import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const DEEPSEEK_API_KEY = 'sk-d07874cdcc1340ebabff7785d0d0d04b';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: string;
  messageCount?: number;
}

export const ChatView: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => { if (currentSessionId) loadMessages(currentSessionId); }, [currentSessionId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingText]);

  const loadSessions = async () => {
    try {
      const response = await api.getChatSessions();
      if (response.success && response.sessions) {
        const parsed = response.sessions.map((s: any) => ({ ...s, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) }));
        setSessions(parsed);
        if (parsed.length > 0 && !currentSessionId) setCurrentSessionId(parsed[0].id);
        else if (parsed.length === 0) await createNewSession();
      }
    } catch (error) { console.error(error); }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const response = await api.getChatMessages(sessionId);
      if (response.success && response.messages) {
        setMessages(response.messages.map((m: any) => ({ id: m.id, content: m.content, isUser: m.isUser, timestamp: new Date(m.createdAt) })));
      }
    } catch (error) { console.error(error); }
  };

  const createNewSession = async () => {
    try {
      const response = await api.createChatSession(`Чат ${new Date().toLocaleDateString()}`);
      if (response.success && response.session) {
        const newSession = { ...response.session, createdAt: new Date(response.session.createdAt), updatedAt: new Date(response.session.updatedAt) };
        setSessions([newSession, ...sessions]);
        setCurrentSessionId(newSession.id);
        setShowSessions(false);
      }
    } catch (error) { toast.error('Помилка створення чату'); }
  };

  // ==================== ВИКОНАННЯ ДІЙ ====================
  const executeAction = async (action: string, params: any): Promise<string | null> => {
    console.log('🚀 Виконую дію:', action, params);
    
    try {
      // ДОДАТИ ЦІЛЬ
      if (action === 'ADD_GOAL') {
        const goalData = {
          name: params.name,
          targetAmount: params.amount,
          currentAmount: 0,
          imageEmoji: params.emoji || '🎯',
          notes: params.notes || '',
          deadline: params.deadline || null,
          currency: user?.currency || '₴'
        };
        console.log('📤 Надсилаємо ціль:', goalData);
        const response = await api.createGoal(goalData);
        console.log('📥 Відповідь сервера:', response);
        if (response.success) {
          return `✅ Ціль "${params.name}" на ${params.amount}${user?.currency || '₴'} додано до розділу Цілі!`;
        }
        return `❌ Помилка: ${response.error || 'невідома помилка'}`;
      }
      
      // ДОДАТИ ВИТРАТУ
      if (action === 'ADD_EXPENSE') {
        const expenseData = {
          title: params.title,
          amount: params.amount,
          category: params.category || 'Інше',
          date: new Date().toISOString(),
          notes: params.notes || '',
          isIncome: false,
          currency: user?.currency || '₴'
        };
        console.log('📤 Надсилаємо витрату:', expenseData);
        const response = await api.createExpense(expenseData);
        console.log('📥 Відповідь сервера:', response);
        if (response.success) {
          return `✅ Витрату "${params.title}" на ${params.amount}${user?.currency || '₴'} додано до розділу Фінанси!`;
        }
        return `❌ Помилка: ${response.error || 'невідома помилка'}`;
      }
      
      // ДОДАТИ ДОХІД
      if (action === 'ADD_INCOME') {
        const incomeData = {
          title: params.title,
          amount: params.amount,
          category: params.category || 'Зарплата',
          date: new Date().toISOString(),
          notes: params.notes || '',
          isIncome: true,
          currency: user?.currency || '₴'
        };
        console.log('📤 Надсилаємо дохід:', incomeData);
        const response = await api.createExpense(incomeData);
        console.log('📥 Відповідь сервера:', response);
        if (response.success) {
          return `✅ Дохід "${params.title}" на ${params.amount}${user?.currency || '₴'} додано до розділу Фінанси!`;
        }
        return `❌ Помилка: ${response.error || 'невідома помилка'}`;
      }
      
      // СТВОРИТИ СПИСОК ПОКУПОК
      if (action === 'CREATE_SHOPPING_LIST') {
        const listData = { name: params.name, reminderDate: null, reminderLeadMinutes: 30 };
        console.log('📤 Створюємо список:', listData);
        const response = await api.createShoppingList(listData);
        console.log('📥 Відповідь сервера:', response);
        if (response.success) {
          return `🛒 Список покупок "${params.name}" створено! Додавайте товари командою "додай до списку ${params.name} товар"`;
        }
        return `❌ Помилка: ${response.error || 'невідома помилка'}`;
      }
      
      // ДОДАТИ ТОВАРИ ДО СПИСКУ
      if (action === 'ADD_SHOPPING_ITEMS') {
        const listsResponse = await api.getShoppingLists();
        if (listsResponse.success && listsResponse.lists) {
          const list = listsResponse.lists.find((l: any) => l.name.toLowerCase() === params.listName.toLowerCase());
          if (list) {
            let successCount = 0;
            for (const itemName of params.items) {
              const itemData = { name: itemName.trim(), quantity: '', isCompleted: false };
              const itemResponse = await api.addShoppingItem(list.id, itemData);
              if (itemResponse.success) successCount++;
            }
            return `✅ Додано ${successCount}/${params.items.length} товарів до списку "${params.listName}"!`;
          }
          return `❌ Список "${params.listName}" не знайдено. Спочатку створіть список командою "створи список покупок ${params.listName}"`;
        }
        return `❌ Помилка отримання списків`;
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ Помилка виконання дії:', error);
      return `❌ Помилка: ${error.response?.data?.error || error.message}`;
    }
  };

  // ==================== ПАРСИНГ ТЕГІВ ====================
  const parseActionsFromText = (text: string): { action: string; params: any }[] => {
    const actions: { action: string; params: any }[] = [];
    
    // Шукаємо {{ADD_GOAL:назва|сума|емодзі|нотатки|deadline}}
    const goalMatch = text.match(/\{\{ADD_GOAL:([^|]+)\|([^|]+)\|([^|]*)\|([^|]*)\|?([^}]*)\}\}/i);
    if (goalMatch) {
      actions.push({
        action: 'ADD_GOAL',
        params: {
          name: goalMatch[1].trim(),
          amount: parseFloat(goalMatch[2]),
          emoji: goalMatch[3].trim() || '🎯',
          notes: goalMatch[4].trim(),
          deadline: goalMatch[5].trim() !== 'none' ? goalMatch[5].trim() : null
        }
      });
    }
    
    // Шукаємо {{ADD_EXPENSE:назва|сума|категорія|нотатки}}
    const expenseMatch = text.match(/\{\{ADD_EXPENSE:([^|]+)\|([^|]+)\|([^|]+)\|([^}]*)\}\}/i);
    if (expenseMatch) {
      actions.push({
        action: 'ADD_EXPENSE',
        params: {
          title: expenseMatch[1].trim(),
          amount: parseFloat(expenseMatch[2]),
          category: expenseMatch[3].trim(),
          notes: expenseMatch[4].trim()
        }
      });
    }
    
    // Шукаємо {{ADD_INCOME:назва|сума|категорія|нотатки}}
    const incomeMatch = text.match(/\{\{ADD_INCOME:([^|]+)\|([^|]+)\|([^|]+)\|([^}]*)\}\}/i);
    if (incomeMatch) {
      actions.push({
        action: 'ADD_INCOME',
        params: {
          title: incomeMatch[1].trim(),
          amount: parseFloat(incomeMatch[2]),
          category: incomeMatch[3].trim(),
          notes: incomeMatch[4].trim()
        }
      });
    }
    
    // Шукаємо {{CREATE_LIST:назва}}
    const listMatch = text.match(/\{\{CREATE_LIST:([^}]+)\}\}/i);
    if (listMatch) {
      actions.push({
        action: 'CREATE_SHOPPING_LIST',
        params: { name: listMatch[1].trim() }
      });
    }
    
    // Шукаємо {{ADD_ITEMS:назва_списку|товар1,товар2}}
    const itemsMatch = text.match(/\{\{ADD_ITEMS:([^|]+)\|([^}]+)\}\}/i);
    if (itemsMatch) {
      const items = itemsMatch[2].split(',').map(i => i.trim());
      actions.push({
        action: 'ADD_SHOPPING_ITEMS',
        params: {
          listName: itemsMatch[1].trim(),
          items: items
        }
      });
    }
    
    return actions;
  };

  const cleanTextFromTags = (text: string): string => {
    return text.replace(/\{\{[^}]+\}\}/g, '').trim();
  };

  // ==================== ВІДПРАВКА ПОВІДОМЛЕННЯ ====================
  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading || isStreaming) return;

    console.log('📨 Відправка повідомлення:', text);

    const userMessage: ChatMessage = { id: Date.now().toString(), content: text, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    if (currentSessionId) await api.createChatMessage(currentSessionId, text, true);

    try {
      setIsStreaming(true);
      setStreamingText('');
      
      // Отримуємо поточну статистику для контексту
      let statsText = '';
      try {
        const expenses = await api.getExpenses();
        const goals = await api.getGoals();
        const totalExpenses = (expenses.expenses || []).filter((e: any) => !e.isIncome).reduce((s: number, e: any) => s + e.amount, 0);
        const totalIncome = (expenses.expenses || []).filter((e: any) => e.isIncome).reduce((s: number, e: any) => s + e.amount, 0);
        statsText = `Поточні дані користувача:
- Загальні витрати: ${totalExpenses}${user?.currency || '₴'}
- Загальні доходи: ${totalIncome}${user?.currency || '₴'}
- Кількість цілей: ${(goals.goals || []).length}`;
      } catch (e) { console.log('Не вдалося отримати статистику'); }
      
      console.log('🤖 Запит до DeepSeek API...');
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { 
              role: 'system', 
              content: `Ти Lis — фінансовий асистент. Відповідай українською коротко, використовуй емодзі.

${statsText}

КОЛИ КОРИСТУВАЧ ПРОСИТЬ ДОДАТИ ДАНІ - ТИ ОБОВ'ЯЗКОВО ДОДАЄШ В КІНЦІ ВІДПОВІДІ ОДИН З ЦИХ ТЕГІВ:

1. Для цілі: {{ADD_GOAL:назва|сума|емодзі|нотатки|none}}
   Приклад: "Додаю ціль! {{ADD_GOAL:Новий телефон|15000|📱||none}}"

2. Для витрати: {{ADD_EXPENSE:назва|сума|категорія|нотатки}}
   Приклад: "Додаю витрату! {{ADD_EXPENSE:Кава|50|Їжа|}}"

3. Для доходу: {{ADD_INCOME:назва|сума|категорія|нотатки}}
   Приклад: "Додаю дохід! {{ADD_INCOME:Зарплата|15000|Зарплата|}}"

4. Для списку покупок: {{CREATE_LIST:назва}}
   Приклад: "Створюю список! {{CREATE_LIST:Продукти}}"

5. Для товарів у список: {{ADD_ITEMS:назва_списку|товар1, товар2, товар3}}
   Приклад: "Додаю товари! {{ADD_ITEMS:Продукти|молоко, хліб, яйця}}"

ТЕГ ЗАВЖДИ ДОДАЄТЬСЯ В КІНЦІ ВІДПОВІДІ НА ОКРЕМОМУ РЯДКУ.
Після виконання дії система автоматично підтвердить додавання.`
            },
            ...messages.slice(-8).map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.content })),
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          max_tokens: 600,
          stream: true,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) { fullResponse += content; setStreamingText(fullResponse); }
          } catch (e) {}
        }
      }

      console.log('📝 Повна відповідь AI:', fullResponse);
      
      // Шукаємо теги у відповіді
      const actions = parseActionsFromText(fullResponse);
      console.log('🎯 Знайдені дії:', actions);
      
      let actionResults: string[] = [];
      for (const act of actions) {
        console.log(`🔧 Виконую ${act.action} з параметрами:`, act.params);
        const result = await executeAction(act.action, act.params);
        if (result) {
          console.log(`✅ Результат: ${result}`);
          actionResults.push(result);
        }
      }
      
      const cleanResponse = cleanTextFromTags(fullResponse);
      let finalResponse = cleanResponse;
      if (actionResults.length > 0) {
        finalResponse = cleanResponse + '\n\n' + actionResults.join('\n');
      }
      
      console.log('💬 Фінальна відповідь для користувача:', finalResponse);
      
      const aiMessage: ChatMessage = { id: Date.now().toString(), content: finalResponse, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
      if (currentSessionId) await api.createChatMessage(currentSessionId, finalResponse, false);
      
    } catch (error) {
      console.error('❌ Помилка AI:', error);
      const errorMsg = 'Вибач, сталася помилка. Спробуй ще раз.';
      setStreamingText(errorMsg);
      setMessages(prev => [...prev, { id: Date.now().toString(), content: errorMsg, isUser: false, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingText('');
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Видалити цей чат?')) return;
    try {
      await api.deleteChatSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        const next = sessions.find(s => s.id !== sessionId);
        next ? setCurrentSessionId(next.id) : createNewSession();
      }
    } catch (error) { toast.error('Помилка видалення'); }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-background rounded-xl overflow-hidden border border-border">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-20 w-80 bg-background border-r border-border transform transition-transform md:relative md:translate-x-0 ${showSessions ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="font-semibold">Історія чатів</h2>
            <button onClick={() => setShowSessions(false)} className="md:hidden p-1 rounded-lg hover:bg-secondary">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map(s => (
              <div key={s.id} className={`group relative p-3 rounded-lg cursor-pointer transition-all ${currentSessionId === s.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary'}`} onClick={() => { setCurrentSessionId(s.id); setShowSessions(false); }}>
                <p className="font-medium text-sm truncate pr-8">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">{s.lastMessage || 'Новий чат'}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(s.updatedAt, 'dd MMM, HH:mm', { locale: uk })}</p>
                <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="absolute right-2 top-2 p-1 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">🗑️</button>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <button onClick={createNewSession} className="w-full py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition-opacity">+ Новий чат</button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <button onClick={() => setShowSessions(true)} className="md:hidden p-2 rounded-lg hover:bg-secondary">☰</button>
          <h3 className="font-semibold flex-1">{currentSession?.name || 'Чат з AI'}</h3>
          <p className="text-xs text-muted-foreground">Lis — фінансовий асистент</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-muted-foreground">Привіт! Я Lis, твій фінансовий асистент</p>
              <p className="text-sm text-muted-foreground mt-2">Можу додавати витрати, доходи, цілі та списки покупок за командою</p>
              <div className="mt-6 p-4 bg-secondary/30 rounded-xl max-w-md mx-auto">
                <p className="text-xs font-medium text-muted-foreground mb-2">📝 Приклади команд:</p>
                <ul className="text-xs text-left space-y-1 text-muted-foreground">
                  <li>• "додай витрату Кава на 50 грн"</li>
                  <li>• "додай дохід Зарплата на 15000 грн"</li>
                  <li>• "додай ціль Телефон на 15000"</li>
                  <li>• "створи список покупок Продукти"</li>
                  <li>• "додай до списку Продукти молоко, хліб, яйця"</li>
                </ul>
              </div>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.isUser ? 'bg-primary text-white' : 'bg-secondary/70 border border-border'}`}>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                <p className={`text-xs mt-1 ${m.isUser ? 'text-white/70' : 'text-muted-foreground'}`}>{format(m.timestamp, 'HH:mm')}</p>
              </div>
            </div>
          ))}
          {isStreaming && streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-secondary/70 border border-border">
                <p className="text-sm whitespace-pre-wrap">{streamingText}<span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-1" /></p>
              </div>
            </div>
          )}
          {isLoading && !isStreaming && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-secondary/70">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Напишіть повідомлення або команду..."
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={1}
              disabled={isLoading || isStreaming}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading || isStreaming}
              className="px-5 py-3 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              ➤
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Enter — відправити, Shift+Enter — новий рядок</p>
        </div>
      </div>
    </div>
  );
};
